const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'adhim@gmail.com' }, 
    include: { tenant: { include: { contracts: { include: { invoices: true } } } } } 
  });
  
  if (!user || !user.tenant) {
    console.log('User adhim@gmail.com or their tenant record not found');
    return;
  }
  
  const invoices = user.tenant.contracts.flatMap(c => c.invoices);
  if (invoices.length === 0) {
    console.log('No invoices found for this user');
    return;
  }
  
  // Find an ACTIVE or OVERDUE invoice, or just the first one
  const targetInvoice = invoices.find(inv => inv.status === 'ACTIVE' || inv.status === 'OVERDUE') || invoices[0];
  
  // Set due date to today (or slightly in the past to make it explicitly overdue or due today)
  const today = new Date();
  // Set to current time minus 1 hour to make sure it's "overdue" if the system checks strict time, 
  // or just keep it today so it says "jatuh tempo hari ini".
  // Let's set it to today at 23:59:59
  today.setHours(23, 59, 59, 999);
  
  const updated = await prisma.invoice.update({
    where: { id: targetInvoice.id },
    data: { 
      dueDate: today,
      // If the user wants to test "overdue" notifications later, it can be OVERDUE. 
      // But they said "jatuh tempo nya hari ini", so let's keep status ACTIVE, and let the system determine if it's due today.
      // Wait, if it's active and due today, they can test the payment.
      status: 'ACTIVE'
    }
  });
  
  console.log(`Successfully updated invoice ID: ${updated.id}`);
  console.log(`New due date: ${updated.dueDate}`);
  console.log(`Amount: ${updated.totalAmount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
