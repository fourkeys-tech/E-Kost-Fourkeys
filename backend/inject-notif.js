const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'adhim@gmail.com' } });
  if (!user) return console.log('User not found');
  
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'PAYMENT_REMINDER',
      channel: 'IN_APP',
      message: 'Tagihan Anda sebesar Rp 7.000.000 jatuh tempo HARI INI. Mohon segera lakukan pembayaran untuk menghindari denda keterlambatan.',
      status: 'sent',
      isRead: false,
      sentAt: new Date(),
    }
  });
  console.log('Notification injected!');
}

main().finally(() => prisma.$disconnect());
