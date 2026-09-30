import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer setup untuk foto properti
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'properties');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const propertySchema = z.object({
  name: z.string().min(2, 'Nama properti minimal 2 karakter'),
  address: z.string().min(5, 'Alamat wajib diisi'),
  provinceId: z.string().optional(),
  province: z.string().optional(),
  regencyId: z.string().optional(),
  regency: z.string().optional(),
  districtId: z.string().optional(),
  district: z.string().optional(),
  villageId: z.string().optional(),
  village: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  description: z.string().optional(),
  facilities: z.union([z.string(), z.array(z.string())]).optional(),
  photos: z.array(z.string()).optional(),
  lateFeePct: z.coerce.number().min(0).max(100).optional(),
  maxLateFee: z.coerce.number().min(0).max(100).optional(),
  type: z.enum(['KOST', 'KONTRAKAN', 'KONTRAKAN_PETAK', 'KONTRAKAN_RUMAH']).optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
});

// GET /api/properties
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const baseWhere: any =
      req.user!.role === 'OWNER'
        ? { ownerId: req.user!.id, isActive: true }
        : req.user!.role === 'ADMIN'
        ? { admins: { some: { userId: req.user!.id } }, isActive: true }
        : { isActive: true };

    if (search) {
      baseWhere.OR = [
        { name: { contains: search } },
        { address: { contains: search } }
      ];
    }

    const total = await prisma.property.count({ where: baseWhere });

    const properties = await prisma.property.findMany({
      where: baseWhere,
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { rooms: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Tambahkan statistik kamar
    const result = await Promise.all(
      properties.map(async (p) => {
        const rooms = await prisma.room.groupBy({
          by: ['status'],
          where: { propertyId: p.id },
          _count: true,
        });
        const stats = { empty: 0, occupied: 0, maintenance: 0 };
        rooms.forEach((r) => {
          if (r.status === 'EMPTY') stats.empty = r._count;
          if (r.status === 'OCCUPIED') stats.occupied = r._count;
          if (r.status === 'MAINTENANCE') stats.maintenance = r._count;
        });
        return { 
          ...p, 
          roomStats: stats,
          facilities: JSON.parse(p.facilities || '[]'),
          photos: JSON.parse(p.photos || '[]'),
        };
      })
    );

    res.json({
      data: result,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// POST /api/properties
router.post(
  '/',
  authenticate,
  authorize('OWNER', 'SUPER_ADMIN'),
  upload.array('photos', 10),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = propertySchema.parse(req.body);
      const uploadedPhotos = (req.files as Express.Multer.File[]).map(
        (f) => `/uploads/properties/${f.filename}`
      );
      // Jika data.photos ada (dari URL string), gabungkan dengan file yang diupload
      const photos = [...(data.photos || []), ...uploadedPhotos];
      const facilities =
        typeof data.facilities === 'string'
          ? data.facilities.split(',').map((s) => s.trim())
          : data.facilities || [];

      const property = await prisma.property.create({
        data: {
          ownerId: req.user!.id,
          name: data.name,
          address: data.address,
          provinceId: data.provinceId,
          province: data.province,
          regencyId: data.regencyId,
          regency: data.regency,
          districtId: data.districtId,
          district: data.district,
          villageId: data.villageId,
          village: data.village,
          latitude: data.latitude,
          longitude: data.longitude,
          description: data.description,
          facilities: JSON.stringify(facilities),
          photos: JSON.stringify(photos),
          lateFeePct: data.lateFeePct ?? 2.0,
          maxLateFee: data.maxLateFee ?? 10.0,
          type: data.type || 'KOST',
          billingCycle: data.billingCycle || 'MONTHLY',
        },
      });
      res.status(201).json({
        ...property,
        facilities: JSON.parse(property.facilities || '[]'),
        photos: JSON.parse(property.photos || '[]')
      });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
      console.error(err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// GET /api/properties/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, isActive: true },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        rooms: { orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }] },
        admins: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!property) { res.status(404).json({ error: 'Properti tidak ditemukan' }); return; }
    
    res.json({
      ...property,
      facilities: JSON.parse(property.facilities || '[]'),
      photos: JSON.parse(property.photos || '[]'),
      rooms: property.rooms.map(room => ({
        ...room,
        facilities: JSON.parse(room.facilities || '[]'),
        photos: JSON.parse(room.photos || '[]')
      }))
    });
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/properties/:id
router.patch(
  '/:id',
  authenticate,
  authorize('OWNER', 'SUPER_ADMIN'),
  upload.array('photos', 10),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const property = await prisma.property.findFirst({
        where: { id: req.params.id, ownerId: req.user!.id },
      });
      if (!property) { res.status(404).json({ error: 'Properti tidak ditemukan' }); return; }

      const data = propertySchema.partial().parse(req.body);
      const newPhotos = ((req.files as Express.Multer.File[]) || []).map(
        (f) => `/uploads/properties/${f.filename}`
      );
      const facilities =
        typeof data.facilities === 'string'
          ? data.facilities.split(',').map((s) => s.trim())
          : data.facilities;
          
      // Base photos are either from request body or existing property
      const basePhotos = data.photos ?? JSON.parse(property.photos || '[]');

      const updated = await prisma.property.update({
        where: { id: req.params.id },
        data: {
          ...data,
          facilities: facilities ? JSON.stringify(facilities) : property.facilities,
          photos: JSON.stringify([...basePhotos, ...newPhotos]),
        },
      });
      
      // Parse kembali sebelum kirim response agar konsisten
      res.json({
        ...updated,
        facilities: JSON.parse(updated.facilities || '[]'),
        photos: JSON.parse(updated.photos || '[]'),
      });
    } catch (err) {
      console.error('PATCH ERROR:', err);
      if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
      res.status(500).json({ error: 'Terjadi kesalahan server: ' + String(err) });
    }
  }
);

// DELETE /api/properties/:id (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize('OWNER', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.property.updateMany({
        where: { id: req.params.id, ownerId: req.user!.id },
        data: { isActive: false },
      });
      res.json({ message: 'Properti berhasil dihapus' });
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

export { router as propertyRoutes };
