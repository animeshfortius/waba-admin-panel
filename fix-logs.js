const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLogs() {
  try {
    console.log("🔄 Updating logs userId to 'admin'...");
    const updated = await prisma.campaignLog.updateMany({
      data: { userId: "admin" }
    });
    console.log(`✅ Success! Total ${updated.count} logs ki userId 'admin' set kar di gayi hai.`);
  } catch (err) {
    console.error("❌ Error updating logs:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fixLogs();