import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.invoice.update({
    where: { id: 'e9eeec71-c13e-4570-abb0-5a7180f050d0' },
    data: { status: 'PAID' }
  });
  console.log('Fixed second invoice to PAID');
}
run();
