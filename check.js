const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function checkData() {
  try {
    const accounts = await prisma.wabaAccount.findMany();
    console.log(`📱 Total Active WABA Accounts: ${accounts.length}`);

    for (const acc of accounts) {
      const chats = await prisma.chatSession.count({ where: { channel: { contains: acc.displayPhone } } });
      const logs = await prisma.campaignLog.count({ where: { channel: { contains: acc.displayPhone } } });
      const templates = await prisma.whatsAppTemplate.count({ where: { wabaId: acc.wabaId } });

      console.log(`\n🔹 Account: ${acc.displayName} (+${acc.displayPhone})`);
      console.log(`   - Chat Sessions: ${chats}`);
      console.log(`   - Campaign Logs: ${logs}`);
      console.log(`   - Templates: ${templates}`);
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();