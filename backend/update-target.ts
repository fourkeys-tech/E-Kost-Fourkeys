import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetId = 'e558e053-2576-4f62-b667-3e6f450cd0ab';
  
  // Check if it's a payment
  let payment = await prisma.payment.findUnique({
    where: { id: targetId },
    include: { contract: true }
  });

  if (payment) {
    console.log('Found Payment record. Updating status to WAITING_VERIFICATION...');
    await prisma.payment.update({
      where: { id: targetId },
      data: { status: 'WAITING_VERIFICATION' }
    });
    
    // Also ensure the corresponding invoice is WAITING_VERIFICATION
    await prisma.invoice.updateMany({
      where: { contractId: payment.contractId, status: 'ACTIVE' },
      data: { status: 'WAITING_VERIFICATION' }
    });
    console.log('Done updating Payment and related Invoice.');
    return;
  }

  // Check if it's an invoice
  let invoice = await prisma.invoice.findUnique({
    where: { id: targetId },
    include: { contract: true }
  });

  if (invoice) {
    console.log('Found Invoice record. Creating dummy WAITING_VERIFICATION payment for it...');
    await prisma.invoice.update({
      where: { id: targetId },
      data: { status: 'WAITING_VERIFICATION' }
    });

    const newPayment = await prisma.payment.create({
      data: {
        contractId: invoice.contractId,
        amount: invoice.totalAmount - invoice.paidAmount,
        method: 'MANUAL',
        status: 'WAITING_VERIFICATION',
        proofUrl: '/dummy-proof.jpg',
        notes: 'Manual dummy payment creation'
      }
    });
    console.log(`Created payment ${newPayment.id} with WAITING_VERIFICATION status.`);
    return;
  }

  console.log('Record not found as Payment or Invoice.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
