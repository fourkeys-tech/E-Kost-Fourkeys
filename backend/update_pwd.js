const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const user = await prisma.user.updateMany({
    where: { email: 'adhim@gmail.com' },
    data: { passwordHash }
  });
  console.log('Updated users:', user.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
