import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Seeding database...');

  // Main branch
  const branch = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Main Branch',
      address: 'Head Office',
      phone: '01700000000',
      email: 'main@business.com',
    },
  });

  // Admin user
  const hashed = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashed,
      name: 'System Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      branchId: branch.id,
    },
  });

  // Role permissions
  const roles = [
    { roleName: 'SUPER_ADMIN', permissions: { all: true } },
    { roleName: 'ADMIN', permissions: { all: true } },
    {
      roleName: 'BRANCH_MANAGER',
      permissions: {
        sales: true,
        purchases: true,
        inventory: true,
        customers: true,
        suppliers: true,
        reports: true,
        expenses: true,
      },
    },
    {
      roleName: 'SALES_MANAGER',
      permissions: {
        sales: true,
        customers: true,
        products: true,
        reports: ['sales'],
      },
    },
    {
      roleName: 'SALESMAN',
      permissions: { sales: true, customers: true, products: true },
    },
    {
      roleName: 'ACCOUNTANT',
      permissions: {
        payments: true,
        expenses: true,
        loans: true,
        capital: true,
        reports: true,
        accounts: true,
      },
    },
    {
      roleName: 'INVENTORY_MANAGER',
      permissions: { inventory: true, products: true, stock: true },
    },
    {
      roleName: 'PURCHASE_MANAGER',
      permissions: { purchases: true, suppliers: true, products: true },
    },
    { roleName: 'CASHIER', permissions: { sales: true, payments: true } },
    { roleName: 'EMPLOYEE', permissions: {} },
  ];
  for (const r of roles) {
    await prisma.rolePermission.upsert({
      where: { roleName: r.roleName },
      update: {},
      create: r,
    });
  }

  // Units
  const units = [
    { name: 'Piece', shortName: 'Pcs' },
    { name: 'Box', shortName: 'Box' },
    { name: 'Kilogram', shortName: 'KG' },
    { name: 'Gram', shortName: 'gm' },
    { name: 'Liter', shortName: 'Ltr' },
    { name: 'Meter', shortName: 'Mtr' },
    { name: 'Dozen', shortName: 'Dzn' },
    { name: 'Carton', shortName: 'Ctn' },
  ];
  for (const u of units) {
    await prisma.unit.upsert({
      where: { name: u.name },
      update: {},
      create: u,
    });
  }

  // Categories
  const categories = [
    'Electronics',
    'Clothing',
    'Food & Beverage',
    'Hardware',
    'Stationery',
    'Medicine',
    'Cosmetics',
    'General',
  ];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Brands
  const brands = [
    'Samsung',
    'Apple',
    'Sony',
    'Generic',
    'Local Brand',
    'Walton',
    'Pran',
    'Square',
  ];
  for (const name of brands) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Default accounts
  const accounts = [
    { name: 'Main Cash', accountType: 'CASH' as const, openingBalance: 0 },
    {
      name: 'Main Bank Account',
      accountType: 'BANK' as const,
      openingBalance: 0,
    },
  ];
  for (const a of accounts) {
    const exists = await prisma.account.findFirst({ where: { name: a.name } });
    if (!exists)
      await prisma.account.create({
        data: { ...a, balance: a.openingBalance, branchId: branch.id },
      });
  }

  // Default system settings
  const settings = [
    { key: 'company_name', value: 'My Business', group: 'company' },
    { key: 'company_address', value: 'Dhaka, Bangladesh', group: 'company' },
    { key: 'company_phone', value: '01700000000', group: 'company' },
    { key: 'currency', value: 'BDT', group: 'business' },
    { key: 'currency_symbol', value: '৳', group: 'business' },
    { key: 'date_format', value: 'DD/MM/YYYY', group: 'business' },
    { key: 'invoice_prefix', value: 'INV', group: 'invoice' },
    { key: 'purchase_prefix', value: 'PUR', group: 'invoice' },
    { key: 'decimal_precision', value: '2', group: 'business' },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log('[SEED] Done.');
  console.log(`   Branch    : ${branch.name}`);
  console.log(`   Admin     : ${admin.email} / password: admin123`);
  console.log(`   Units     : ${units.length} seeded`);
  console.log(`   Categories: ${categories.length} seeded`);
  console.log(`   Brands    : ${brands.length} seeded`);
  console.log(`   Accounts  : ${accounts.length} seeded`);
  console.log(`   Settings  : ${settings.length} seeded`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
