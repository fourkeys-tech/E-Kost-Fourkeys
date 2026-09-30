import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer setup untuk foto kamar
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'rooms');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const roomSchema = z.object({
  propertyId: z.string().uuid(),
  roomNumber: z.string().min(1),
  type: z.string().min(1),
  price: z.coerce.number().positive(),
  floor: z.coerce.number().int().optional(),
  description: z.string().optional(),
  facilities: z.union([z.string(), z.array(z.string())]).optional(),
  photos: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  depositAmount: z.coerce.number().min(0).optional(),
});

// GET /api/rooms?propertyId=
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, status, search, location, minPrice, maxPrice, facility, sort, category } = req.query;
    
    const baseWhere: any =
      req.user!.role === 'OWNER'
        ? { property: { ownerId: req.user!.id } }
        : req.user!.role === 'ADMIN'
        ? { property: { admins: { some: { userId: req.user!.id } } } }
        : req.user!.role === 'TENANT'
        ? { status: 'EMPTY' }
        : {};

    if (propertyId) baseWhere.propertyId = propertyId as string;
    if (status && req.user!.role !== 'TENANT') baseWhere.status = status as string;
    
    if (search) {
      baseWhere.OR = [
        { type: { contains: search as string } },
        { property: { name: { contains: search as string } } }
      ];
    }
    
    if (minPrice || maxPrice) {
      baseWhere.price = {};
      if (minPrice) baseWhere.price.gte = Number(minPrice);
      if (maxPrice) baseWhere.price.lte = Number(maxPrice);
    }
    
    if (facility) {
      baseWhere.facilities = { contains: facility as string };
    }
    
    // Add filtering by location (regency, district, province)
    if (location) {
      if (!baseWhere.property) baseWhere.property = {};
      baseWhere.property.OR = [
        { regency: { contains: location as string } },
        { district: { contains: location as string } },
        { province: { contains: location as string } }
      ];
    }
    
    // Filter by property type (Kost vs Kontrakan)
    if (category && category !== 'Semua') {
      if (!baseWhere.property) baseWhere.property = {};
      baseWhere.property.type = category as string;
    }
    
    let orderBy: any = [{ floor: 'asc' }, { roomNumber: 'asc' }];
    if (sort === 'price_asc') {
      orderBy = [{ price: 'asc' }];
    } else if (sort === 'price_desc') {
      orderBy = [{ price: 'desc' }];
    } else if (sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }];
    }

    const rooms = await prisma.room.findMany({
      where: baseWhere,
      include: {
        property: { select: { name: true, type: true, address: true, district: true, regency: true, province: true } },
        contracts: {
          where: { isActive: true },
          include: {
            tenant: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
          },
        },
      },
      orderBy,
    });
    res.json(rooms.map(room => ({
      ...room,
      facilities: JSON.parse(room.facilities || '[]'),
      photos: JSON.parse(room.photos || '[]')
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' }); 
  }
});

// POST /api/rooms
router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'),
  upload.array('photos', 5),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = roomSchema.parse(req.body);
      const facilities =
        typeof data.facilities === 'string'
          ? data.facilities.split(',').map((s) => s.trim())
          : data.facilities || [];

      const uploadedPhotos = (req.files as Express.Multer.File[] | undefined)?.map(
        (f) => `/uploads/rooms/${f.filename}`
      ) || [];
      
      let parsedExistingPhotos: string[] = [];
      if (typeof data.photos === 'string') {
        try { parsedExistingPhotos = JSON.parse(data.photos); } catch { parsedExistingPhotos = [data.photos]; }
      } else if (Array.isArray(data.photos)) {
        parsedExistingPhotos = data.photos;
      }
      
      const photos = [...parsedExistingPhotos, ...uploadedPhotos];

      const room = await prisma.room.create({
        data: {
          propertyId: data.propertyId,
          roomNumber: data.roomNumber,
          type: data.type,
          price: data.price,
          floor: data.floor,
          description: data.description,
          facilities: JSON.stringify(facilities),
          photos: JSON.stringify(photos),
          status: data.status || 'EMPTY',
          category: data.category || 'Campur',
          depositAmount: data.depositAmount || 0,
        },
      });
      res.status(201).json({
        ...room,
        facilities: JSON.parse(room.facilities || '[]'),
        photos: JSON.parse(room.photos || '[]')
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
      if ((err as { code?: string }).code === 'P2002') {
        res.status(400).json({ error: 'Nomor kamar sudah ada di properti ini' }); return;
      }
      res.status(500).json({ error: 'Terjadi kesalahan server: ' + (err as Error).message });
    }
  }
);

// GET /api/rooms/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        property: { select: { id: true, name: true, ownerId: true } },
        contracts: {
          include: {
            tenant: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
            invoices: { take: 3, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
    if (!room) { res.status(404).json({ error: 'Kamar tidak ditemukan' }); return; }
    res.json({
      ...room,
      facilities: JSON.parse(room.facilities || '[]'),
      photos: JSON.parse(room.photos || '[]')
    });
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

// PATCH /api/rooms/:id
router.patch(
  '/:id',
  authenticate,
  authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'),
  upload.array('photos', 5),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = roomSchema.partial().parse(req.body);
      const facilities =
        typeof data.facilities === 'string'
          ? data.facilities.split(',').map((s) => s.trim())
          : data.facilities;

      const uploadedPhotos = (req.files as Express.Multer.File[] | undefined)?.map(
        (f) => `/uploads/rooms/${f.filename}`
      ) || [];
      
      let parsedExistingPhotos: string[] | undefined;
      if (data.photos !== undefined) {
        if (typeof data.photos === 'string') {
          try { parsedExistingPhotos = JSON.parse(data.photos); } catch { parsedExistingPhotos = [data.photos]; }
        } else if (Array.isArray(data.photos)) {
          parsedExistingPhotos = data.photos;
        }
      }

      const updateData: any = { ...data };
      if (facilities) updateData.facilities = JSON.stringify(facilities);
      if (parsedExistingPhotos !== undefined || uploadedPhotos.length > 0) {
        updateData.photos = JSON.stringify([...(parsedExistingPhotos || []), ...uploadedPhotos]);
      } else {
        delete updateData.photos;
      }

      const room = await prisma.room.update({
        where: { id: req.params.id },
        data: updateData,
      });
      res.json({
        ...room,
        facilities: JSON.parse(room.facilities || '[]'),
        photos: JSON.parse(room.photos || '[]')
      });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  }
);

// DELETE /api/rooms/:id
router.delete(
  '/:id',
  authenticate,
  authorize('OWNER', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.room.delete({ where: { id: req.params.id } });
      res.json({ message: 'Kamar berhasil dihapus' });
    } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
  }
);

export { router as roomRoutes };
