import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('Worker123!', 10);
  await prisma.healthWorker.upsert({
    where: { phone: '+91-9900022222' },
    update: {},
    create: {
      name: 'Ramesh ASHA',
      phone: '+91-9900022222',
      passwordHash: hash,
      role: Role.ASHA,
      region: 'Rural District 1'
    }
  });
  console.log('Worker inserted');
}
main();
