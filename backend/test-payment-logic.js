const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoice = await prisma.invoice.findFirst({
    where: { contract: { tenant: { user: { email: 'adhim@gmail.com' } } } },
    include: { contract: { include: { room: { include: { property: { include: { admins: true } } } }, tenant: { include: { user: true } } } } }
  });

  if (!invoice) {
    console.log('No invoice found');
    return;
  }

  const targetContractId = invoice.contractId;
  const paymentAmount = invoice.totalAmount;

  const contractData = await prisma.contract.findUnique({
    where: { id: targetContractId },
    include: { 
      room: { include: { property: { include: { admins: true } } } },
      tenant: { include: { user: true } }
    }
  });

  if (contractData) {
    const prop = contractData.room.property;
    const tenantName = contractData.tenant.user.name;
    const userIdsToNotify = [prop.ownerId, ...prop.admins.map(a => a.userId)];
    
    console.log('Would notify:', userIdsToNotify);
    console.log('Tenant:', tenantName);
    console.log('Message:', `Penyewa ${tenantName} (Kamar ${contractData.room.roomNumber}) telah mengunggah bukti pembayaran sebesar Rp ${paymentAmount.toLocaleString('id-ID')}. Menunggu verifikasi Anda.`);
  }

  console.log('Logic is safe!');
}

main().finally(() => prisma.$disconnect());
