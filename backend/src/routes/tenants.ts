import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

import bcrypt from 'bcryptjs';

const router = Router();

const tenantSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  idCardNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
});

// GET /api/tenants?propertyId=
router.get('/', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.query;
    const tenants = await prisma.tenant.findMany({
      where: propertyId ? {
        contracts: { some: { room: { propertyId: propertyId as string }, isActive: true } },
      } : undefined,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        contracts: {
          where: { isActive: true },
          include: { room: { include: { property: { select: { id: true, name: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tenants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// POST /api/tenants (daftarkan penyewa baru + buat user account)
router.post('/', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = tenantSchema.parse(req.body);

    // Cek email sudah terdaftar
    let user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      // Buat akun user baru dengan password default
      const tempPassword = `Kost${Date.now()}`;
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          phone: data.phone,
          role: 'TENANT',
        },
      });
      // TODO: kirim email dengan credential ke tenant
    }

    // Cek apakah sudah ada tenant record
    let tenant = await prisma.tenant.findUnique({ where: { userId: user.id } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          userId: user.id,
          phone: data.phone,
          idCardNumber: data.idCardNumber,
          emergencyContact: data.emergencyContact,
        },
      });
    }

    res.status(201).json({
      ...tenant,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET /api/tenants/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        contracts: {
          include: {
            room: { include: { property: { select: { id: true, name: true, address: true } } } },
            invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!tenant) { res.status(404).json({ error: 'Penyewa tidak ditemukan' }); return; }
    res.json(tenant);
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

// PATCH /api/tenants/:id
router.patch('/:id', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = tenantSchema.partial().parse(req.body);
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: {
        phone: data.phone,
        idCardNumber: data.idCardNumber,
        emergencyContact: data.emergencyContact,
        user: data.name || data.email ? {
          update: {
            ...(data.name && { name: data.name }),
            ...(data.phone && { phone: data.phone }),
          },
        } : undefined,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(tenant);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export { router as tenantRoutes };
