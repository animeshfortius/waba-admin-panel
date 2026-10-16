import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@waba.com" },
    update: {
      username: "admin", // Purane user ka username force-update karne ke liye
      password: hashedPassword,
    },
    create: {
      name: "Super Admin",
      username: "admin",
      email: "admin@waba.com",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log("Admin seeded successfully:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });