import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst();
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'SecureAdmin123!';
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    console.log('Admin user created successfully:');
    console.log('Email:', admin.email);
    console.log('ID:', admin.id);
    console.log('Created at:', admin.createdAt);
    
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
