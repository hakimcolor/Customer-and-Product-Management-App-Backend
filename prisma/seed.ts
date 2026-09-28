import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Main branch
  const branch = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Main Branch', address: 'Head Office', phone: '01700000000' },
  });

  // Admin user (status: ACTIVE by default for admin)
  const hashed = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashed,
      name: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      branchId: branch.id,
    },
  });

  // Role permissions
  const roles = [
    { roleName: 'ADMIN', permissions: { all: true } },
    {
      roleName: 'MANAGER',
      permissions: { sales: true, purchases: true, inventory: true, customers: true, suppliers: true, reports: true, expenses: true },
    },
    {
      roleName: 'ACCOUNTANT',
      permissions: { payments: true, expenses: true, loans: true, capital: true, reports: true },
    },
  ];
  for (const r of roles) {
    await prisma.rolePermission.upsert({ where: { roleName: r.roleName }, update: {}, create: r });
  }

  // Categories
  const categories = ['Electronics', 'Clothing', 'Food & Beverage', 'Hardware', 'Stationery', 'Medicine', 'Cosmetics'];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Brands
  const brands = ['Samsung', 'Apple', 'Sony', 'Generic', 'Local Brand', 'Walton', 'Pran'];
  for (const name of brands) {
    await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('✅ Seed complete!');
  console.log(`   Branch : ${branch.name}`);
  console.log(`   Admin  : ${admin.email} / password: admin123`);
  console.log(`   Categories: ${categories.length} seeded`);
  console.log(`   Brands: ${brands.length} seeded`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
