# Customer & Product Management App — Backend

Sales, Inventory, and Accounts Management System built with **Node.js**, **TypeScript**, **Express**, and **PostgreSQL (Prisma)**.

---

## Tech Stack

- Node.js + TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcryptjs
- Multer (file uploads)

---

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma        # Full DB schema (all entities)
├── src/
│   ├── controllers/         # Business logic per module
│   ├── routes/              # Express route definitions
│   ├── middleware/          # Auth middleware (JWT)
│   ├── utils/               # Prisma client singleton
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── .env.example             # Environment variables template
├── package.json
└── tsconfig.json
```

---

## Setup

1. Clone the repo and install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and update your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/sales_inventory_db?schema=public"
JWT_SECRET="your_secret_key"
PORT=5000
```

3. Run database migrations:
```bash
npx prisma migrate dev --name init
```

4. Start development server:
```bash
npm run dev
```

---

## API Modules

| Module | Base URL |
|---|---|
| Auth | `/api/auth` |
| Users & Roles | `/api/users` |
| Branches | `/api/branches` |
| Customers | `/api/customers` |
| Suppliers | `/api/suppliers` |
| Products | `/api/products` |
| Categories | `/api/products/categories` |
| Brands | `/api/products/brands` |
| Stock | `/api/products/stock/*` |
| Purchases | `/api/purchases` |
| Sales | `/api/sales` |
| Payments | `/api/payments` |
| Expenses | `/api/expenses` |
| Loans | `/api/loans` |
| Capital | `/api/capital` |
| Reports | `/api/reports` |
| SMS | `/api/sms` |

---

## Progress Tracker

### ✅ Done
- [x] Project setup (Node.js + TypeScript + Express)
- [x] Prisma schema — all 18 entities (User, Branch, Customer, Supplier, Product, Stock, Purchase, Sale, Payment, Expense, Loan, Capital, Damage, Ledger, StockTransfer, SMSLog, Category, Brand)
- [x] JWT Authentication middleware
- [x] All Controllers (auth, user, branch, customer, supplier, product, category, purchase, sale, payment, expense, loan, report, sms, print, return)
- [x] All Routes wired up
- [x] Role-based authorization (ADMIN / MANAGER / ACCOUNTANT)
- [x] Stock tracking on purchase/sale transactions
- [x] Stock transfer between branches
- [x] Reporting endpoints (daily summary, profit, dues, stock alerts, best sellers)
- [x] File upload for expense vouchers (multer)
- [x] Input validation with Zod on all write endpoints
- [x] Global error handling middleware
- [x] Pagination on all list endpoints (`?page=1&limit=20`)
- [x] Sale return endpoint — restores stock automatically
- [x] Purchase return endpoint — reduces stock automatically
- [x] Print invoice endpoint (`GET /api/print/invoice/:saleId`)
- [x] Barcode data endpoint (`GET /api/print/barcodes`)
- [x] Database seed file (admin user, branches, categories, brands, role permissions)
- [x] GitHub push

### 🔜 Next Steps
- [ ] Connect to PostgreSQL and run `npm run db:migrate`
- [ ] Run seed: `npm run db:seed`
- [ ] SMS provider integration (Twilio / SSL Wireless — stub ready in sms.controller.ts)

---

## Scripts

```bash
npm run dev          # Start dev server with nodemon
npm run build        # Compile TypeScript
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed initial data (admin user, categories, brands)
npm run db:studio    # Open Prisma Studio
```
