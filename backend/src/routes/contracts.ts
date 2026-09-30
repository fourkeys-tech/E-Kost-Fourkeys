import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';


const router = Router();

const contractSchema = z.object({
  tenantId: z.string().uuid(),
  roomId: z.string().uuid(),
  startDate: z.string().transform((s) => new Date(s)),
  durationMonths: z.coerce.number().int().positive(),
  rentAmount: z.coerce.number().positive(),
  deposit: z.coerce.number().min(0).default(0),
  dueDay: z.coerce.number().int().min(1).max(28),
  notes: z.string().optional(),
});

const bookSchema = z.object({
  roomId: z.string().uuid(),
  durationMonths: z.coerce.number().int().positive(),
  startDate: z.string().transform((s) => new Date(s)),
});

// POST /api/contracts/book
router.post('/book', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'TENANT') {
      res.status(403).json({ error: 'Hanya tenant yang dapat melakukan booking' }); return;
    }

    const data = bookSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({ where: { userId: req.user!.id } });
    if (!tenant) {
      res.status(400).json({ error: 'Profil tenant tidak ditemukan' }); return;
    }

    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: { property: true }
    });

    if (!room || room.status !== 'EMPTY') {
      res.status(400).json({ error: 'Kamar tidak tersedia' }); return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Kontrak
      const isKontrakan = room.property.type.includes('KONTRAKAN');
      const deposit = isKontrakan ? 0 : (room.depositAmount ?? 0);
      const dueDay = data.startDate.getDate() > 28 ? 28 : data.startDate.getDate();
      
      const contract = await tx.contract.create({
        data: {
          tenantId: tenant.id,
          roomId: room.id,
          startDate: data.startDate,
          durationMonths: data.durationMonths,
          rentAmount: room.price,
          deposit: deposit,
          depositStatus: 'HELD',
          dueDay: dueDay,
          isActive: false, // Pending first payment
          notes: 'Self-checkout / Booking via Aplikasi'
        }
      });

      // 2. Buat Invoice Pertama
      const totalAmount = room.price + deposit;
      const dueDate = new Date();
      dueDate.setHours(23, 59, 59, 999); // Jatuh tempo hari ini pkl 23:59

      const invoice = await tx.invoice.create({
        data: {
          contractId: contract.id,
          period: `${data.startDate.getFullYear()}-${String(data.startDate.getMonth() + 1).padStart(2, '0')}`,
          amount: room.price,
          lateFee: 0,
          totalAmount: totalAmount,
          paidAmount: 0,
          status: 'PENDING',
          dueDate: dueDate,
          notes: 'Invoice Pembayaran Pertama & Deposit'
        }
      });

      // 3. Update Status Kamar
      await tx.room.update({
        where: { id: room.id },
        data: { status: 'OCCUPIED' } 
      });

      return invoice;
    });

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET /api/contracts?propertyId=&tenantId=
router.get('/', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, tenantId, isActive } = req.query;
    const contracts = await prisma.contract.findMany({
      where: {
        ...(propertyId ? { room: { propertyId: propertyId as string } } : {}),
        ...(tenantId ? { tenantId: tenantId as string } : {}),
        ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      },
      include: {
        tenant: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        room: { include: { property: { select: { id: true, name: true } } } },
        invoices: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contracts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// POST /api/contracts
router.post('/', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = contractSchema.parse(req.body);

    // Cek kamar tersedia
    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room || room.status !== 'EMPTY') {
      res.status(400).json({ error: 'Kamar tidak tersedia atau sedang terisi' }); return;
    }

    // Hitung end date
    const endDate = new Date(data.startDate);
    endDate.setMonth(endDate.getMonth() + data.durationMonths);

    const contract = await prisma.contract.create({
      data: {
        tenantId: data.tenantId,
        roomId: data.roomId,
        startDate: data.startDate,
        endDate,
        durationMonths: data.durationMonths,
        rentAmount: data.rentAmount,
        deposit: data.deposit,
        dueDay: data.dueDay,
        notes: data.notes,
        isActive: true,
      },
    });

    // Update status kamar jadi occupied
    await prisma.room.update({
      where: { id: data.roomId },
      data: { status: 'OCCUPIED' },
    });

    res.status(201).json(contract);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET /api/contracts/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        room: { include: { property: true } },
        invoices: { orderBy: { dueDate: 'desc' }, include: { payments: true } },
      },
    });
    if (!contract) { res.status(404).json({ error: 'Kontrak tidak ditemukan' }); return; }
    res.json(contract);
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

// PATCH /api/contracts/:id/checkout (akhiri kontrak)
router.patch('/:id/checkout', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: { room: true },
    });
    if (!contract) { res.status(404).json({ error: 'Kontrak tidak ditemukan' }); return; }

    await prisma.contract.update({
      where: { id: req.params.id },
      data: { isActive: false, endDate: new Date() },
    });

    // Update kamar jadi kosong
    await prisma.room.update({
      where: { id: contract.roomId },
      data: { status: 'EMPTY' },
    });

    res.json({ message: 'Check-out berhasil, kamar kini tersedia' });
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

export { router as contractRoutes };
