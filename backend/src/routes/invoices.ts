import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

import { generateInvoices } from '../services/invoiceService';

const router = Router();

// GET /api/invoices?status=&propertyId=&period=
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, propertyId, period, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;
    if (period) where.period = period as string;
    if (propertyId) where.contract = { room: { propertyId: propertyId as string } };

    // Tenant hanya bisa lihat tagihan miliknya
    if (req.user!.role === 'TENANT') {
      const tenant = await prisma.tenant.findFirst({ where: { userId: req.user!.id } });
      if (!tenant) { res.json({ data: [], total: 0, page: 1, totalPages: 0 }); return; }
      where.contract = { tenantId: tenant.id };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          contract: {
            include: {
              tenant: { include: { user: { select: { id: true, name: true, email: true } } } },
              room: { include: { property: { select: { id: true, name: true } } } },
            },
          },
          allocations: { include: { payment: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { dueDate: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      data: invoices,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET /api/invoices/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        contract: {
          include: {
            tenant: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
            room: { include: { property: true } },
            payments: {
              where: { status: 'WAITING_VERIFICATION' },
              orderBy: { createdAt: 'desc' },
              take: 1
            },
          },
        },
        allocations: {
          include: {
            payment: {
              include: { verifiedBy: { select: { id: true, name: true } } }
            }
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!invoice) { res.status(404).json({ error: 'Tagihan tidak ditemukan' }); return; }
    res.json(invoice);
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

// POST /api/invoices/generate (manual trigger)
router.post('/generate', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await generateInvoices();
    res.json({ message: 'Generate tagihan berhasil dijalankan' });
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

// POST /api/invoices (buat tagihan manual)
router.post('/', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    contractId: z.string().uuid(),
    period: z.string().regex(/^\d{4}-\d{2}$/),
    amount: z.coerce.number().positive(),
    dueDate: z.string().transform((s) => new Date(s)),
    notes: z.string().optional(),
  });
  try {
    const data = schema.parse(req.body);
    const invoice = await prisma.invoice.create({
      data: {
        contractId: data.contractId,
        period: data.period,
        amount: data.amount,
        lateFee: 0,
        totalAmount: data.amount,
        status: 'ACTIVE',
        dueDate: data.dueDate,
        notes: data.notes,
      },
    });
    res.status(201).json(invoice);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    if ((err as { code?: string }).code === 'P2002') {
      res.status(400).json({ error: 'Tagihan untuk periode ini sudah ada' }); return;
    }
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});
// POST /api/invoices/pay-early
router.post('/pay-early', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    contractId: z.string().uuid(),
    targetPeriod: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  });
  try {
    const data = schema.parse(req.body);
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: { invoices: { orderBy: { dueDate: 'desc' }, take: 1 } },
    });

    if (!contract || !contract.isActive) {
      res.status(400).json({ error: 'Kontrak tidak aktif atau tidak ditemukan' }); return;
    }

    // Verify it's the tenant's own contract (or owner)
    if (req.user!.role === 'TENANT' && contract.tenantId !== req.user!.tenantId) {
      // Check tenant id properly
      const tenant = await prisma.tenant.findUnique({ where: { userId: req.user!.id } });
      if (!tenant || tenant.id !== contract.tenantId) {
        res.status(403).json({ error: 'Unauthorized' }); return;
      }
    }

    const latestInvoice = contract.invoices[0];
    if (!latestInvoice) {
      res.status(400).json({ error: 'Tidak ada referensi tagihan sebelumnya' }); return;
    }

    let nextPeriod: string;
    let year: number;
    let month: number;

    if (data.targetPeriod) {
      nextPeriod = data.targetPeriod;
      const [y, m] = nextPeriod.split('-');
      year = parseInt(y);
      month = parseInt(m);
    } else {
      const [yearStr, monthStr] = latestInvoice.period.split('-');
      year = parseInt(yearStr);
      month = parseInt(monthStr);
      
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      nextPeriod = `${year}-${String(month).padStart(2, '0')}`;
    }
    
    // Calculate next due date
    const nextDueDate = new Date(year, month - 1, contract.dueDay);
    
    // Check if next due date exceeds endDate
    if (contract.endDate && nextDueDate > contract.endDate) {
      res.status(400).json({ error: 'Tagihan bulan berikutnya melebihi masa sewa kontrak' }); return;
    }

    const existing = await prisma.invoice.findFirst({
      where: { contractId: contract.id, period: nextPeriod },
    });

    if (existing) {
      res.status(400).json({ error: 'Tagihan untuk periode berikutnya sudah dibuat' }); return;
    }

    const invoice = await prisma.invoice.create({
      data: {
        contractId: contract.id,
        period: nextPeriod,
        amount: contract.rentAmount,
        lateFee: 0,
        totalAmount: contract.rentAmount,
        status: 'ACTIVE',
        dueDate: nextDueDate,
      },
    });

    res.status(201).json(invoice);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});


// PATCH /api/invoices/:id/cancel
router.patch('/:id/cancel', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json(invoice);
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

export { router as invoiceRoutes };
