import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, role: true,
        themePreference: true, phone: true, isActive: true, createdAt: true,
      },
    });
    if (!user) { res.status(404).json({ error: 'Pengguna tidak ditemukan' }); return; }
    res.json(user);
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

// PATCH /api/users/profile
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    themePreference: z.enum(['light', 'dark', 'system']).optional(),
  });
  try {
    const data = schema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, name: true, email: true, role: true, themePreference: true, phone: true },
    });
    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/users/change-password
router.patch('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  });
  try {
    const data = schema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) { res.status(404).json({ error: 'Pengguna tidak ditemukan' }); return; }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) { res.status(400).json({ error: 'Password lama tidak benar' }); return; }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.id }, data: { passwordHash } });
    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

export { router as userRoutes };
