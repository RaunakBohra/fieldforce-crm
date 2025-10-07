import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'Test1234';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Delete existing test user if exists
    await prisma.user.deleteMany({
      where: { email },
    });

    // Create new test user with ADMIN role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Test Admin',
        role: 'ADMIN',
        phone: '+1234567890',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log('✅ Test user created successfully:');
    console.log(JSON.stringify(user, null, 2));
    console.log('\n📋 Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
