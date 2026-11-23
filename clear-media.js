const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearMedia() {
  try {
    const result = await prisma.mediaLibrary.deleteMany({});
    console.log("Success! Deleted media rows:", result.count);
  } catch (error) {
    console.error("Error clearing media:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearMedia();