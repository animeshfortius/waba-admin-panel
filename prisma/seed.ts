import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10); // Aap apna password yahan change kar sakte hain

  const admin = await prisma.user.upsert({
    where: { email: "admin@waba.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@waba.com",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });