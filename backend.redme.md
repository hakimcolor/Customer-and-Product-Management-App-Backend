<div align="center">

# ⚙️ Business ERP — Backend

**Node.js · Express · TypeScript · PostgreSQL · Prisma**

A scalable, secure REST API for a full-featured Business ERP system — managing sales, purchases, inventory, accounts, multi-branch operations, and more.

</div>

---

## ✨ Tech Stack

| Tool                    | Purpose                      |
| ----------------------- | ---------------------------- |
| Node.js + Express       | Server framework             |
| TypeScript              | Type safety                  |
| PostgreSQL              | Database                     |
| Prisma ORM              | Database access & migrations |
| JWT + HTTP-only Cookies | Authentication               |
| Bcrypt                  | Password hashing             |
| Zod                     | Input validation             |
| Multer                  | File uploads                 |

---

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── branches/
│   ├── customers/
│   ├── suppliers/
│   ├── products/
│   ├── inventory/
│   ├── sales/
│   ├── purchases/
│   ├── payments/
│   ├── expenses/
│   ├── accounts/
│   ├── loans/
│   ├── capital/
│   ├── ledger/
│   ├── reports/
│   ├── notifications/
│   └── sms/
├── middleware/
├── utils/
├── config/
└── app.ts
prisma/
├── schema/
└── seed.ts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Install & Run

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

API runs at: `http://localhost:5000/api/v1`

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/erp_db
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=5000
NODE_ENV=development
```

---

## 📡 API Standards

All endpoints follow REST conventions under `/api/v1/`.

```
GET    /api/v1/products         # List with pagination & filters
POST   /api/v1/products         # Create
GET    /api/v1/products/:id     # Get one
PATCH  /api/v1/products/:id     # Update
DELETE /api/v1/products/:id     # Delete
```

**Success response:**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {}
}
```

**Error response:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

All list endpoints support: `?search=&page=&limit=&sortBy=&order=&startDate=&endDate=&branchId=`

---

## 🗄️ Core Database Models

```
User · Role · Permission · RolePermission

Branch · Warehouse

Customer · Supplier

Category · Brand · Unit
Product · ProductVariant

Stock · StockMovement · StockAdjustment
StockTransfer · StockTransferItem · Damage

Sale · SaleItem · SalePayment
SaleReturn · SaleReturnItem

Purchase · PurchaseItem · PurchasePayment
PurchaseReturn · PurchaseReturnItem

Payment · PaymentMethod

Expense · ExpenseCategory

Account · BankAccount · CashAccount · AccountTransaction

Loan · LoanPayment

Capital · CapitalTransaction

Ledger · LedgerEntry

Notification · SMSLog · AuditLog

SystemSetting · InvoiceSetting
```

---

## 🔐 Authentication & Security

- JWT access token + refresh token
- HTTP-only cookies (no localStorage token exposure)
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Granular permission system per module
- Branch-level data isolation
- Rate limiting
- CORS configuration
- Input validation on all routes
- SQL injection protection via Prisma
- Audit logging on critical actions

**Roles (customizable):**
Super Admin · Admin · Branch Manager · Sales Manager · Salesman · Accountant · Inventory Manager · Cashier

---

## 🏢 Multi-Branch Support

- Each user assigned to one or more branches
- All data scoped to branch
- Branch-wise reports, stock, accounts
- Stock transfer between branches and warehouses

---

## 💼 Key Business Logic

### When a Sale is Created

All of the following happen inside a single **database transaction**:

```
1. Create Sale record
2. Create Sale Items
3. Decrease stock per item
4. Record Stock Movement
5. Update Customer due balance
6. Record Payment (if any)
7. Update Cash/Bank account
8. Update Customer Ledger
9. Update Profit calculation
10. Create Audit Log
```

If any step fails → **full rollback**. No partial data.

Same pattern applies for Purchases, Payments, Stock Transfers, Returns.

---

## 📦 Module Overview

| Module                      | Key Features                                        |
| --------------------------- | --------------------------------------------------- |
| Auth                        | Login, logout, refresh token, forgot/reset password |
| Users                       | CRUD, roles, branch assignment, profile picture     |
| Roles & Permissions         | Granular per-module permissions                     |
| Branches & Warehouses       | Multi-branch, multi-warehouse                       |
| Customers                   | Profile, ledger, dues, payment history              |
| Suppliers                   | Profile, ledger, payables, purchase history         |
| Products                    | SKU, barcode, variants, images, import/export       |
| Categories / Brands / Units | Master data management                              |
| POS                         | Fast billing, barcode scan, hold/resume, print      |
| Sales                       | Invoice, partial payment, return, PDF               |
| Purchases                   | GRN, supplier payment, return                       |
| Inventory                   | Real-time stock, adjustments, damage, transfers     |
| Payments                    | Multi-method (Cash, Bank, Mobile), receipts         |
| Accounts                    | Cash, bank, mobile banking, transfers               |
| Expenses                    | Categories, vouchers, attachments                   |
| Loans                       | Borrowed/lent, installments, status tracking        |
| Capital                     | Owners, investments, withdrawals                    |
| Ledger                      | Double-entry style, running balance                 |
| Reports                     | Sales, purchase, stock, finance, profit/loss        |
| Notifications               | In-app, SMS, email                                  |
| Audit Logs                  | Full action history with before/after values        |
| Settings                    | Company info, invoice config, tax, currency         |

---

## 📊 Stock Movement Rules

**Stock increases via:**
Purchase · Sales Return · Stock Adjustment (positive) · Transfer Received

**Stock decreases via:**
Sale · Purchase Return · Damage · Stock Adjustment (negative) · Transfer Sent

---

## 🔄 Stock Transfer Workflow

```
REQUESTED → APPROVED → SENT → RECEIVED → COMPLETED
```

Each step is recorded with user, timestamp, and quantities.

---

## 🧾 Invoice & Printing

Supported formats: `A4 · A5 · Thermal 58mm · Thermal 80mm`

Features: Company logo, customer info, product table, discount, VAT, paid/due, terms, QR code verification

---

## 🛠️ Scripts

```bash
npm run dev             # Start dev server with hot reload
npm run build           # Compile TypeScript
npm run start           # Start production server
npm run seed            # Seed database with sample data
npx prisma studio       # Open Prisma visual DB browser
npx prisma migrate dev  # Run new migrations
```

---

## 🚢 Deployment

```
Backend  → Node.js (Docker recommended)
Database → PostgreSQL
Files    → Local storage or S3-compatible
Proxy    → Nginx with HTTPS/SSL
```

**Production env:**

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=strong-secret
```

---

## 🔗 Related

- [Frontend Repository](../Customer-and-Product-Management-App-Frontend UI/frontend/Frontend.redme.md)
- Default API port: `5000`
- API prefix: `/api/v1`

---

<div align="center">
Built with ❤️ using Node.js + TypeScript + PostgreSQL
</div>
