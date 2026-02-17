import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../lib/db';

async function main() {
  const adminPassword = await bcrypt.hash('Admin1234!', 10);
  const rmPassword = await bcrypt.hash('Rm1234!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@territory.local' },
    update: { role: Role.ADMIN, passwordHash: adminPassword },
    create: { email: 'admin@territory.local', name: 'Admin User', role: Role.ADMIN, passwordHash: adminPassword }
  });

  await prisma.user.upsert({
    where: { email: 'rm@territory.local' },
    update: { role: Role.RM, passwordHash: rmPassword },
    create: { email: 'rm@territory.local', name: 'RM User', role: Role.RM, passwordHash: rmPassword }
  });

  console.log('Seeded users:\n- admin@territory.local / Admin1234!\n- rm@territory.local / Rm1234!');
}

main().finally(async () => prisma.$disconnect());
