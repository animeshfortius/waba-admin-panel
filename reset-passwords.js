const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10); // Sabka naya password 'Admin@123' set kar rahe hain

  // 1. Reseller ka password update karo
  await prisma.user.updateMany({
    where: { username: 'fortiusinfocom' },
    data: { password: hashedPassword }
  });

  // 2. User ka password update karo
  await prisma.user.updateMany({
    where: { username: 'animeshfortius' },
    data: { password: hashedPassword }
  });

  console.log("Reseller aur User ke passwords successfully reset ho gaye hain!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());