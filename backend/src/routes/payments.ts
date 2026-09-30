import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'payments');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Mock Midtrans Snap token generator
function mockMidtransToken(orderId: string, amount: number) {
  return {
    token: `snap-token-${orderId}-${Date.now()}`,
    redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-${orderId}`,
    order_id: orderId,
    amount,
    mock: true,
  };
}

// Helper: Alokasi Pembayaran
async function allocatePayment(paymentId: string, contractId: string, amount: number) {
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      contractId,
      status: { in: ['ACTIVE', 'OVERDUE', 'PARTIAL', 'WAITING_VERIFICATION'] }
    },
    orderBy: { dueDate: 'asc' }
  });

  let remainingAmount = amount;

  for (const inv of unpaidInvoices) {
    if (remainingAmount <= 0) break;

    const amountNeeded = inv.totalAmount - inv.paidAmount;
    if (amountNeeded <= 0) continue;

    const amountToAllocate = Math.min(amountNeeded, remainingAmount);

    if (amountToAllocate > 0) {
      await prisma.paymentAllocation.create({
        data: {
          paymentId,
          invoiceId: inv.id,
          amount: amountToAllocate
        }
      });

      const newPaidAmount = inv.paidAmount + amountToAllocate;
      const newStatus = newPaidAmount >= inv.totalAmount ? 'PAID' : 'PARTIAL';

      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : null
        }
      });

      remainingAmount -= amountToAllocate;
    }
  }

  if (remainingAmount > 0) {
    await prisma.contract.update({
      where: { id: contractId },
      data: { balance: { increment: remainingAmount } }
    });
  }
}

// POST /api/payments — submit pembayaran
router.post('/', authenticate, upload.single('proof'), async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    invoiceId: z.string().uuid().optional(),
    contractId: z.string().uuid().optional(),
    amount: z.string().optional(),
    method: z.string(),
    notes: z.string().optional(),
  });

  try {
    const data = schema.parse(req.body);
    let targetContractId = data.contractId;
    let paymentAmount = 0;

    if (data.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { contract: { include: { room: { include: { property: true } } } } },
      });
      if (!invoice) { res.status(404).json({ error: 'Tagihan tidak ditemukan' }); return; }
      if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
        res.status(400).json({ error: 'Tagihan sudah lunas atau dibatalkan' }); return;
      }

      targetContractId = invoice.contractId;
      paymentAmount = data.amount ? parseFloat(data.amount) : (invoice.totalAmount - invoice.paidAmount);

      if (paymentAmount !== (invoice.totalAmount - invoice.paidAmount)) {
        res.status(400).json({ error: 'Pembayaran harus dilakukan secara penuh sesuai tagihan' }); return;
      }

      // Update the targeted invoice status directly to WAITING_VERIFICATION
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'WAITING_VERIFICATION' }
      });



    } else if (targetContractId) {
      paymentAmount = data.amount ? parseFloat(data.amount) : 0;
      if (paymentAmount <= 0) { res.status(400).json({ error: 'Nominal pembayaran tidak valid' }); return; }
    } else {
      res.status(400).json({ error: 'contractId atau invoiceId wajib diisi' }); return;
    }

    if (data.method === 'MANUAL') {
      if (!req.file) { res.status(400).json({ error: 'Bukti transfer wajib diunggah untuk pembayaran manual' }); return; }

      const proofUrl = `/uploads/payments/${req.file.filename}`;
      const payment = await prisma.payment.create({
        data: {
          contractId: targetContractId as string,
          method: 'MANUAL',
          amount: paymentAmount,
          proofUrl,
          status: 'WAITING_VERIFICATION',
          notes: data.notes,
        },
      });

      // Send notification to Owner & Admins
      const contractData = await prisma.contract.findUnique({
        where: { id: targetContractId as string },
        include: {
          room: { include: { property: { include: { admins: true } } } },
          tenant: { include: { user: true } }
        }
      });
      if (contractData) {
        const prop = contractData.room.property;
        const tenantName = contractData.tenant.user.name;
        const userIdsToNotify = [prop.ownerId, ...prop.admins.map((a: any) => a.userId)];

        await Promise.all(userIdsToNotify.map(uid =>
          prisma.notification.create({
            data: {
              userId: uid,
              type: 'PAYMENT_RECEIVED',
              channel: 'IN_APP',
              message: `Penyewa ${tenantName} (Kamar ${contractData.room.roomNumber}) telah mengunggah bukti pembayaran sebesar Rp ${paymentAmount.toLocaleString('id-ID')}. Menunggu verifikasi Anda.`,
              status: 'sent',
              sentAt: new Date(),
            }
          })
        ));
      }

      res.status(201).json({ ...payment, message: 'Bukti pembayaran berhasil diunggah, menunggu verifikasi' });
    } else {
      // Midtrans mock
      const orderId = `KOSTPAY-${targetContractId}-${Date.now()}`;
      const snapData = mockMidtransToken(orderId, paymentAmount);

      const payment = await prisma.payment.create({
        data: {
          contractId: targetContractId as string,
          method: 'MIDTRANS',
          amount: paymentAmount,
          midtransToken: snapData.token,
          midtransOrderId: orderId,
          status: 'PENDING',
          notes: data.notes,
        },
      });

      res.status(201).json({ ...payment, snap: snapData });
    }
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// POST /api/payments/webhook — Midtrans webhook (no auth)
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { order_id, transaction_status, fraud_status } = req.body;
    if (!order_id) { res.status(400).json({ error: 'order_id wajib' }); return; }

    const payment = await prisma.payment.findFirst({
      where: { midtransOrderId: order_id }
    });
    if (!payment) { res.status(404).json({ error: 'Payment tidak ditemukan' }); return; }

    const isSuccess =
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement';

    if (isSuccess && payment.status !== 'VERIFIED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      });
      await allocatePayment(payment.id, payment.contractId, payment.amount);
      console.log(`✅ Midtrans webhook: Payment ${payment.id} VERIFIED`);
    } else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'EXPIRED' },
      });
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Webhook error' });
  }
});

// PATCH /api/payments/:id/verify — verifikasi manual oleh Admin/Owner
router.patch('/:id/verify', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    action: z.enum(['approve', 'reject']),
    rejectReason: z.string().optional(),
  });

  try {
    const data = schema.parse(req.body);
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { contract: { include: { tenant: { include: { user: true } } } } },
    });
    if (!payment) { res.status(404).json({ error: 'Pembayaran tidak ditemukan' }); return; }
    if (payment.method !== 'MANUAL') {
      res.status(400).json({ error: 'Hanya pembayaran manual yang perlu diverifikasi' }); return;
    }

    if (data.action === 'approve') {
      await prisma.payment.update({
        where: { id: req.params.id },
        data: {
          status: 'VERIFIED',
          verifiedById: req.user!.id,
          verifiedAt: new Date(),
        },
      });

      await allocatePayment(payment.id, payment.contractId, payment.amount);

      await prisma.notification.create({
        data: {
          userId: payment.contract.tenant.userId,
          type: 'PAYMENT_VERIFIED',
          channel: 'EMAIL',
          message: `Pembayaran Anda sebesar telah diverifikasi dan dialokasikan ke tagihan.`,
          status: 'sent',
          sentAt: new Date(),
        },
      });
    } else {
      await prisma.payment.update({
        where: { id: req.params.id },
        data: {
          status: 'REJECTED',
          verifiedById: req.user!.id,
          verifiedAt: new Date(),
          rejectReason: data.rejectReason,
        },
      });

      // Reset status WAITING_VERIFICATION invoices for this contract back to ACTIVE
      // In advanced implementations, this would evaluate dueDate to set OVERDUE
      await prisma.invoice.updateMany({
        where: { contractId: payment.contractId, status: 'WAITING_VERIFICATION' },
        data: { status: 'ACTIVE' }
      });

      await prisma.notification.create({
        data: {
          userId: payment.contract.tenant.userId,
          type: 'PAYMENT_REJECTED',
          channel: 'EMAIL',
          message: `Pembayaran Anda ditolak. Alasan: ${data.rejectReason || 'Bukti tidak valid'}. Silakan upload ulang.`,
          status: 'sent',
          sentAt: new Date(),
        },
      });
    }

    res.json({ message: data.action === 'approve' ? 'Pembayaran disetujui' : 'Pembayaran ditolak' });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET /api/payments
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, contractId } = req.query;
    const payments = await prisma.payment.findMany({
      where: {
        ...(contractId ? { contractId: contractId as string } : {}),
        ...(status ? { status: status as string } : {}),
        ...(req.user!.role === 'TENANT'
          ? { contract: { tenant: { userId: req.user!.id } } }
          : {}),
      },
      include: {
        contract: {
          include: {
            tenant: { include: { user: { select: { id: true, name: true } } } },
            room: { include: { property: { select: { id: true, name: true } } } },
          },
        },
        allocations: {
          include: { invoice: true }
        },
        verifiedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

export { router as paymentRoutes };
