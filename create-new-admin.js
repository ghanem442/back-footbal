const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@football.com';
  const password = 'Admin@123456';
  const name = 'Admin User';

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
      role: 'ADMIN',
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      passwordHash,
      name,
      role: 'ADMIN',
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Admin account created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('👤 Name:', name);
  console.log('🎭 Role:', admin.role);
  console.log('✔️  Verified:', admin.isVerified);
  console.log('🆔 ID:', admin.id);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
