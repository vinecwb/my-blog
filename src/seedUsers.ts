import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10); // Hash a senha (use um valor seguro para o salt)
    await prisma.user.create({
      data: {
        email: 'joao@example.com',
        name: 'João Santos',
        password: hashedPassword, // Use a senha hasheada
        role: 'PROFESSOR'
      },
    });
    console.log('User seeded successfully.');
  } catch (error) {
    console.error('Error seeding user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();