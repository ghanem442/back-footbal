const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setCommissionRate() {
  try {
    console.log('Checking global commission rate...');

    const setting = await prisma.appSetting.findUnique({
      where: { key: 'global_commission_rate' },
    });

    if (setting) {
      console.log(`✅ Global commission rate already exists: ${setting.value}%`);
    } else {
      console.log('⚠️  Global commission rate not found. Creating with default value of 10%...');
      
      await prisma.appSetting.create({
        data: {
          key: 'global_commission_rate',
          value: '10',
          dataType: 'number',
        },
      });

      console.log('✅ Global commission rate set to 10%');
    }

    // Also check deposit percentage
    const depositSetting = await prisma.appSetting.findUnique({
      where: { key: 'deposit_percentage' },
    });

    if (depositSetting) {
      console.log(`✅ Deposit percentage already exists: ${depositSetting.value}%`);
    } else {
      console.log('⚠️  Deposit percentage not found. Creating with default value of 20%...');
      
      await prisma.appSetting.create({
        data: {
          key: 'deposit_percentage',
          value: '20',
          dataType: 'number',
        },
      });

      console.log('✅ Deposit percentage set to 20%');
    }

    console.log('\n✅ All settings verified successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setCommissionRate();
