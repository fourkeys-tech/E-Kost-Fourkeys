import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

import ExcelJS from 'exceljs';

const router = Router();

// GET /api/reports/summary?propertyId=&timeRange=
router.get('/summary', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, timeRange = 'THIS_MONTH' } = req.query;
    const ownerId = req.user!.role === 'OWNER' ? req.user!.id : undefined;
    const now = new Date();
    
    // Determine target periods for revenue calculation
    let targetPeriods: string[] = [];
    let chartMonthsCount = 6;
    let chartEndDate = now;

    if (timeRange === 'THIS_MONTH') {
      targetPeriods = [`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`];
      chartMonthsCount = 6;
    } else if (timeRange === 'LAST_MONTH') {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      targetPeriods = [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`];
      chartMonthsCount = 6;
      chartEndDate = d;
    } else if (timeRange === 'THIS_YEAR') {
      // 12 months of current year
      for (let i = 0; i < 12; i++) {
        targetPeriods.push(`${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`);
      }
      chartMonthsCount = 12;
      chartEndDate = new Date(now.getFullYear(), 11, 1); // Dec of this year
    }

    const propertyWhere = {
      ...(ownerId ? { ownerId } : {}),
      ...(propertyId ? { id: propertyId as string } : {}),
      isActive: true,
    };

    // Total properti
    const totalProperties = await prisma.property.count({ where: propertyWhere });

    // Total kamar & okupansi
    const properties = await prisma.property.findMany({ where: propertyWhere, select: { id: true } });
    const propertyIds = properties.map((p) => p.id);

    const roomStats = await prisma.room.groupBy({
      by: ['status'],
      where: { propertyId: { in: propertyIds } },
      _count: true,
    });

    const occupied = roomStats.find((r) => r.status === 'OCCUPIED')?._count ?? 0;
    const empty = roomStats.find((r) => r.status === 'EMPTY')?._count ?? 0;
    const maintenance = roomStats.find((r) => r.status === 'MAINTENANCE')?._count ?? 0;
    const totalRooms = occupied + empty + maintenance;
    const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

    // Pendapatan sesuai timeRange
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PAID',
        period: { in: targetPeriods },
        contract: { room: { propertyId: { in: propertyIds } } },
      },
    });
    const currentMonthRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Tunggakan (Tetap Global)
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'OVERDUE',
        contract: { room: { propertyId: { in: propertyIds } } },
      },
    });
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const overdueCount = overdueInvoices.length;

    // Menunggu verifikasi (Tetap Global)
    const waitingVerification = await prisma.payment.count({
      where: {
        status: 'WAITING_VERIFICATION',
        contract: { room: { propertyId: { in: propertyIds } } },
      },
    });

    // Grafik pendapatan
    const chartPeriods = [];
    if (timeRange === 'THIS_YEAR') {
      for (let i = 0; i < 12; i++) {
        chartPeriods.push(`${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`);
      }
    } else {
      for (let i = chartMonthsCount - 1; i >= 0; i--) {
        const d = new Date(chartEndDate.getFullYear(), chartEndDate.getMonth() - i, 1);
        chartPeriods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    }

    const revenueChart = await Promise.all(
      chartPeriods.map(async (period) => {
        const invoices = await prisma.invoice.findMany({
          where: {
            status: 'PAID',
            period,
            contract: { room: { propertyId: { in: propertyIds } } },
          },
        });
        return {
          period,
          revenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
          count: invoices.length,
        };
      })
    );

    res.json({
      totalProperties,
      totalRooms,
      occupied,
      empty,
      maintenance,
      occupancyRate,
      currentMonthRevenue,
      totalOverdue,
      overdueCount,
      waitingVerification,
      revenueChart,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/export?format=excel&propertyId=&period=
router.get('/export', authenticate, authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { format = 'excel', propertyId, period } = req.query;
    const ownerId = req.user!.role === 'OWNER' ? req.user!.id : undefined;

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(period ? { period: period as string } : {}),
        contract: {
          room: {
            ...(propertyId ? { propertyId: propertyId as string } : {}),
            property: ownerId ? { ownerId } : {},
          },
        },
      },
      include: {
        contract: {
          include: {
            tenant: { include: { user: { select: { name: true, email: true } } } },
            room: { include: { property: { select: { name: true } } } },
          },
        },
        payments: { where: { status: 'VERIFIED' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { dueDate: 'desc' },
    });

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Laporan Keuangan');

      sheet.columns = [
        { header: 'Periode', key: 'period', width: 12 },
        { header: 'Properti', key: 'property', width: 25 },
        { header: 'Kamar', key: 'room', width: 10 },
        { header: 'Penyewa', key: 'tenant', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Jatuh Tempo', key: 'dueDate', width: 14 },
        { header: 'Nominal Sewa', key: 'amount', width: 18 },
        { header: 'Denda', key: 'lateFee', width: 15 },
        { header: 'Total', key: 'total', width: 18 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Tanggal Bayar', key: 'paidAt', width: 16 },
      ];

      // Style header
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      const statusMap: Record<string, string> = {
        ACTIVE: 'Aktif',
        PAID: 'Lunas',
        OVERDUE: 'Telat',
        WAITING_VERIFICATION: 'Menunggu Verifikasi',
        CANCELLED: 'Dibatalkan',
        PENDING: 'Belum Terbit',
      };

      invoices.forEach((inv) => {
        sheet.addRow({
          period: inv.period,
          property: inv.contract.room.property.name,
          room: inv.contract.room.roomNumber ?? '-',
          tenant: inv.contract.tenant.user.name,
          email: inv.contract.tenant.user.email,
          dueDate: inv.dueDate.toLocaleDateString('id-ID'),
          amount: inv.amount,
          lateFee: inv.lateFee,
          total: inv.totalAmount,
          status: statusMap[inv.status] ?? inv.status,
          paidAt: inv.paidAt ? inv.paidAt.toLocaleDateString('id-ID') : '-',
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=laporan-keuangan-${period || 'semua'}.xlsx`);
      await workbook.xlsx.write(res);
    } else {
      // JSON fallback
      res.json(invoices);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/notifications?unreadOnly=true
router.get('/notifications', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unreadOnly } = req.query;
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user!.id,
        ...(unreadOnly === 'true' ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

// PATCH /api/reports/notifications/read-all
router.patch('/notifications/read-all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'Semua notifikasi ditandai dibaca' });
  } catch { res.status(500).json({ error: 'Terjadi kesalahan server' }); }
});

export { router as reportRoutes };
