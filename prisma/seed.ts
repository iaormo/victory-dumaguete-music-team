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

  const admin = await prisma.user.upsert({
    where: { email: 'admin@victorydumaguete.com' },
    update: {},
    create: {
      email: 'admin@victorydumaguete.com',
      password,
      displayName: 'Jose M.',
      roles: ['ADMIN', 'KEYBOARD'],
      isAdmin: true,
    },
  });

  const users = [
    { email: 'maria.s@victorydumaguete.com', displayName: 'Maria S.', roles: ['VOCALIST', 'ACOUSTIC_GUITAR'] as any },
    { email: 'chris.r@victorydumaguete.com', displayName: 'Chris R.', roles: ['DRUMS'] as any },
    { email: 'angela.t@victorydumaguete.com', displayName: 'Angela T.', roles: ['BASS_GUITAR'] as any },
    { email: 'miguel.g@victorydumaguete.com', displayName: 'Miguel G.', roles: ['LEAD_GUITAR'] as any },
    { email: 'sofia.l@victorydumaguete.com', displayName: 'Sofia L.', roles: ['VOCALIST', 'KEYBOARD'] as any },
    { email: 'david.p@victorydumaguete.com', displayName: 'David P.', roles: ['VOCALIST'] as any },
    { email: 'isabella.c@victorydumaguete.com', displayName: 'Isabella C.', roles: ['KEYBOARD'] as any },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password,
        displayName: u.displayName,
        roles: u.roles,
        isAdmin: false,
      },
    });
  }

  await prisma.announcement.createMany({
    data: [
      {
        content: 'Team meeting next Saturday at 2 PM. Please come prepared to discuss the new song list for next month.',
        authorId: admin.id,
      },
      {
        content: 'Reminder: All instrumentalists, please check the tuning of your instruments before Sunday service.',
        authorId: admin.id,
      },
      {
        content: 'Welcome to our new vocalist, Sofia! Please make her feel welcome.',
        authorId: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeded successfully!');
  console.log(`Admin login: admin@victorydumaguete.com / victory2024`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
