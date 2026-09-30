import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const payment = await prisma.payment.findUnique({
    where: { id: 'e558e053-2576-4f62-b667-3e6f450cd0ab' },
    include: { allocations: true }
  });
  console.log('Payment:', payment);
  const invoice = await prisma.invoice.findUnique({
    where: { id: 'e558e053-2576-4f62-b667-3e6f450cd0ab' }
  });
  console.log('Invoice:', invoice);
}
run();
