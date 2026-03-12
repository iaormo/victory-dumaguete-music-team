/**
 * Database Seed Script
 * Victory Dumaguete Music Team
 * @author Ian James Ormo
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  const password = await bcrypt.hash('victory2024', 12);

  // Upsert admin account (does NOT delete existing users)
  await prisma.user.upsert({
    where: { email: 'admin@victorydumaguete.com' },
    update: {},
    create: {
      email: 'admin@victorydumaguete.com',
      password,
      displayName: 'admin',
      roles: ['ADMIN'],
      isAdmin: true,
    },
  });

  console.log('Database seeded successfully!');
  console.log(`Admin login: admin@victorydumaguete.com / victory2024`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
