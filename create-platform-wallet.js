const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPlatformWallet() {
  try {
    const wallet = await prisma.platformWallet.upsert({
      where: { id: 'platform-wallet-1' },
      update: {},
      create: {
        id: 'platform-wallet-1',
        balance: 0
      }
    });
    console.log('✅ Platform wallet created successfully:', wallet);
  } catch (error) {
    console.error('❌ Error creating platform wallet:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createPlatformWallet();
