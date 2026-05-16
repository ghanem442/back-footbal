import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create app settings only
  console.log('Creating app settings...');
  
  await prisma.appSetting.upsert({
    where: { key: 'deposit_percentage' },
    update: {},
    create: { key: 'deposit_percentage', value: '20' },
  });

  await prisma.appSetting.upsert({
    where: { key: 'global_commission_rate' },
    update: {},
    create: { key: 'global_commission_rate', value: '10' },
  });

  await prisma.appSetting.upsert({
    where: { key: 'cancellation_policy_hours' },
    update: {},
    create: { key: 'cancellation_policy_hours', value: '24' },
  });

  await prisma.appSetting.upsert({
    where: { key: 'cancellation_refund_percentage' },
    update: {},
    create: { key: 'cancellation_refund_percentage', value: '100' },
  });

  await prisma.appSetting.upsert({
    where: { key: 'no_show_suspension_threshold' },
    update: {},
    create: { key: 'no_show_suspension_threshold', value: '3' },
  });

  await prisma.appSetting.upsert({
    where: { key: 'suspension_duration_days' },
    update: {},
    create: { key: 'suspension_duration_days', value: '7' },
  });

  console.log('App settings created successfully');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });