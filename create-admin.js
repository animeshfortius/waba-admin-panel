const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword, role: 'SUPER_ADMIN' },
    create: {
      username: 'admin',
      email: 'admin@fortius.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Super Admin successfully created:', admin.username);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());