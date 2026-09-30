import { prisma } from '../lib/prisma';


/**
 * Generate tagihan untuk kontrak yang jatuh tempo H-7
 */
export async function generateInvoices(): Promise<void> {
  const today = new Date();
  const targetDay = new Date(today);
  targetDay.setDate(today.getDate() + 7);

  const contracts = await prisma.contract.findMany({
    where: { isActive: true },
    include: { room: { include: { property: true } } },
  });

  for (const contract of contracts) {
    const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const existing = await prisma.invoice.findFirst({
      where: { contractId: contract.id, period },
    });
    if (existing) continue;
    
    // Cek siklus penagihan
    const property = contract.room.property as any;
    if (property.billingCycle === 'YEARLY') {
      if (today.getMonth() !== contract.startDate.getMonth()) {
        continue;
      }
    }

    // Cek apakah due date bulan ini adalah H-7 dari hari ini
    const dueDate = new Date(today.getFullYear(), today.getMonth(), contract.dueDay);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 7 && daysUntilDue >= 0) {
      await prisma.invoice.create({
        data: {
          contractId: contract.id,
          period,
          amount: contract.rentAmount,
          lateFee: 0,
          totalAmount: contract.rentAmount,
          status: 'ACTIVE',
          dueDate,
        },
      });
      console.log(`✅ Invoice generated: Contract ${contract.id} period ${period}`);
    }
  }
}

/**
 * Hitung denda untuk tagihan yang sudah lewat jatuh tempo
 */
export async function calculateLateFees(): Promise<void> {
  const today = new Date();

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['ACTIVE', 'WAITING_VERIFICATION'] },
      dueDate: { lt: today },
    },
    include: {
      contract: { include: { room: { include: { property: true } } } },
    },
  });

  for (const invoice of overdueInvoices) {
    const weeksLate = Math.floor(
      (today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );
    const property = invoice.contract.room.property;
    const lateFeePct = Math.min(
      weeksLate * property.lateFeePct,
      property.maxLateFee
    );
    const lateFee = (invoice.amount * lateFeePct) / 100;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        lateFee,
        totalAmount: invoice.amount + lateFee,
        status: 'OVERDUE',
      },
    });
  }
}

/**
 * Kirim reminder H-3 dan H-1 sebelum jatuh tempo
 */
export async function sendPaymentReminders(): Promise<void> {
  const today = new Date();
  const reminderDays = [1, 3];

  for (const days of reminderDays) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + days);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        contract: {
          include: {
            tenant: { include: { user: true } },
            room: { include: { property: true } },
          },
        },
      },
    });

    for (const invoice of invoices) {
      const tenant = invoice.contract.tenant;
      const user = tenant.user;

      // Mock: log reminder
      console.log(
        `📧 Reminder H-${days} → ${user.email}: Invoice ${invoice.id} jatuh tempo ${invoice.dueDate.toLocaleDateString('id-ID')}`
      );

      // Simpan notifikasi ke DB
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'PAYMENT_REMINDER',
          channel: 'EMAIL',
          message: `Tagihan Anda untuk ${invoice.contract.room.property.name} senilai Rp ${invoice.totalAmount.toLocaleString('id-ID')} jatuh tempo dalam ${days} hari (${invoice.dueDate.toLocaleDateString('id-ID')}).`,
          status: 'sent',
          sentAt: new Date(),
        },
      });
    }
  }
}
