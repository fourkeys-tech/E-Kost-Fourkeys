import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get an invoice belonging to "Budi Penghuni"
  const invoice = await prisma.invoice.findFirst({
    where: {
      contract: {
        tenant: {
          user: {
            name: 'Budi Penghuni'
          }
        }
      }
    },
    include: {
      contract: true
    }
  });

  if (!invoice) {
    console.log("No active invoice found to update.");
    return;
  }

  // Update invoice status to WAITING_VERIFICATION
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: 'WAITING_VERIFICATION' }
  });

  // Create a pending payment so it appears in the owner's verification page
  const payment = await prisma.payment.create({
    data: {
      contractId: invoice.contractId,
      amount: invoice.totalAmount,
      method: 'MANUAL',
      status: 'WAITING_VERIFICATION',
      proofUrl: '/dummy-proof.jpg',
      notes: 'Test payment for verification'
    }
  });

  console.log(`Updated invoice ${invoice.id} to WAITING_VERIFICATION.`);
  console.log(`Created dummy payment ${payment.id} for contract ${invoice.contractId}.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
