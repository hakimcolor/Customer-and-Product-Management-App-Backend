import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Default branch
  const branch = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Main Branch', address: 'Head Office', phone: '01700000000' },
  });

  // Admin user
  const hashed = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashed,
      name: 'Admin User',
      role: 'ADMIN',
      branchId: branch.id,
    },
  });

  // Default role permissions
  await prisma.rolePermission.upsert({
    where: { roleName: 'ADMIN' },
    update: {},
    create: { roleName: 'ADMIN', permissions: { all: true } },
  });
  await prisma.rolePermission.upsert({
    where: { roleName: 'MANAGER' },
    update: {},
    create: { roleName: 'MANAGER', permissions: { sales: true, purchases: true, inventory: true, customers: true, suppliers: true, reports: true } },
  });
  await prisma.rolePermission.upsert({
    where: { roleName: 'ACCOUNTANT' },
    update: {},
    create: { roleName: 'ACCOUNTANT', permissions: { payments: true, expenses: true, loans: true, reports: true } },
  });

  // Sample categories
  const categories = ['Electronics', 'Clothing', 'Food & Beverage', 'Hardware', 'Stationery'];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Sample brands
  const brands = ['Samsung', 'Apple', 'Sony', 'Generic', 'Local'];
  for (const name of brands) {
    await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('✅ Seed complete');
  console.log(`   Branch: ${branch.name}`);
  console.log(`   Admin:  ${admin.email} / password: admin123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
