# Sales, Inventory & Accounts ERP — Backend

A complete, production-ready ERP backend built with **Node.js**, **TypeScript**, **Express**, **PostgreSQL**, and **Prisma ORM**.

---

## Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| Runtime       | Node.js v20+                       |
| Language      | TypeScript 5                       |
| Framework     | Express.js 4                       |
| Database      | PostgreSQL (Prisma Postgres cloud) |
| ORM           | Prisma 5                           |
| Auth          | JWT (jsonwebtoken)                 |
| Validation    | Zod v4                             |
| File Upload   | Multer                             |
| Email         | Nodemailer                         |
| Rate Limiting | express-rate-limit                 |
| Password      | bcryptjs                           |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema/              # Multi-file Prisma schema
│   │   ├── config.prisma    # Generator + datasource
│   │   ├── enums.prisma     # All enums
│   │   ├── user.prisma      # User, RolePermission, LoginHistory, AuditLog
│   │   ├── branch.prisma    # Branch, Warehouse
│   │   ├── customer.prisma  # Customer, Supplier, Ledger
│   │   ├── product.prisma   # Product, Category, Brand, Unit, Stock, StockTransfer, Damage
│   │   ├── purchase.prisma  # Purchase, PurchaseItem, PurchaseReturn
│   │   ├── sale.prisma      # Sale, SaleItem, SaleReturn
│   │   ├── payment.prisma   # Payment
│   │   └── finance.prisma   # Expense, Loan, Capital, Account, SMS, Settings, Notification
│   └── seed.ts              # Database seed
│
├── src/
│   ├── config/
│   │   └── config.ts        # Centralized environment config
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── audit.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── modules/             # Feature modules
│   │   ├── accounts/        # Cash, bank, mobile accounts
│   │   ├── audit/           # Audit logs
│   │   ├── auth/            # Login, logout, forgot/reset password
│   │   ├── branch/          # Multi-branch management
│   │   ├── customer/        # Customer CRUD + ledger
│   │   ├── expense/         # Expense management
│   │   ├── export/          # CSV export
│   │   ├── loan/            # Loans + capital
│   │   ├── notifications/   # In-app notifications
│   │   ├── payment/         # Customer/supplier payments
│   │   ├── pos/             # Point of Sale
│   │   ├── print/           # Invoice printing
│   │   ├── product/         # Products, categories, brands, units, stock
│   │   ├── purchase/        # Purchase management
│   │   ├── report/          # Reports & dashboard
│   │   ├── sale/            # Sales management
│   │   ├── settings/        # System settings
│   │   ├── sms/             # SMS notifications
│   │   ├── supplier/        # Supplier CRUD + ledger
│   │   ├── user/            # User & role management
│   │   └── warehouse/       # Warehouse management
│   ├── utils/
│   │   ├── email.ts         # Email sender
│   │   ├── pagination.ts    # Pagination helpers
│   │   ├── prisma.ts        # Prisma client
│   │   ├── response.ts      # Standardized JSON responses
│   │   ├── token.ts         # Reset token generator
│   │   └── upload.ts        # Multer file upload config
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
│
├── uploads/                 # Uploaded files (gitignored)
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template
└── package.json
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/hakimcolor/Customer-and-Product-Management-App-Backend.git
cd backend
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 3. Push Schema to Database

```bash
npm run db:push
```

### 4. Seed Initial Data

```bash
npm run db:seed
```

This creates:

- Admin user: `admin@example.com` / `admin123`
- Main branch
- 8 units, 8 categories, 8 brands
- 2 default accounts (Cash + Bank)
- 9 system settings

### 5. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:5000`

---

## NPM Scripts

| Script                | Description                     |
| --------------------- | ------------------------------- |
| `npm run dev`         | Start with nodemon (hot reload) |
| `npm run build`       | Compile TypeScript to JS        |
| `npm run start`       | Run compiled JS                 |
| `npm run db:push`     | Push schema changes to database |
| `npm run db:migrate`  | Run migrations                  |
| `npm run db:seed`     | Seed database with initial data |
| `npm run db:studio`   | Open Prisma Studio              |
| `npm run db:generate` | Regenerate Prisma client        |

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Authentication

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/auth/login`           | Login                     |
| POST   | `/auth/logout`          | Logout                    |
| POST   | `/auth/forgot-password` | Request password reset    |
| POST   | `/auth/reset-password`  | Reset password with token |
| PUT    | `/auth/change-password` | Change password           |
| GET    | `/auth/me`              | Get current user          |
| GET    | `/auth/login-history`   | Login history             |

### Users & Roles

| Method | Endpoint                         | Description             |
| ------ | -------------------------------- | ----------------------- |
| GET    | `/users`                         | List users              |
| POST   | `/users`                         | Create user             |
| PUT    | `/users/:id`                     | Update user             |
| DELETE | `/users/:id`                     | Delete user             |
| PUT    | `/users/:id/approve`             | Approve user            |
| PUT    | `/users/:id/deactivate`          | Deactivate user         |
| POST   | `/users/:id/profile-picture`     | Upload profile picture  |
| GET    | `/users/roles`                   | List roles              |
| PUT    | `/users/roles/:role/permissions` | Update role permissions |

### Branches & Warehouses

| Method         | Endpoint          | Description           |
| -------------- | ----------------- | --------------------- |
| GET/POST       | `/branches`       | List / Create         |
| GET/PUT/DELETE | `/branches/:id`   | Get / Update / Delete |
| GET/POST       | `/warehouses`     | List / Create         |
| GET/PUT/DELETE | `/warehouses/:id` | Get / Update / Delete |

### Customers & Suppliers

| Method         | Endpoint                | Description           |
| -------------- | ----------------------- | --------------------- |
| GET/POST       | `/customers`            | List / Create         |
| GET/PUT/DELETE | `/customers/:id`        | Get / Update / Delete |
| GET            | `/customers/:id/ledger` | Customer ledger       |
| GET/POST       | `/suppliers`            | List / Create         |
| GET/PUT/DELETE | `/suppliers/:id`        | Get / Update / Delete |
| GET            | `/suppliers/:id/ledger` | Supplier ledger       |

### Products

| Method         | Endpoint                               | Description            |
| -------------- | -------------------------------------- | ---------------------- |
| GET/POST       | `/products`                            | List / Create          |
| GET/PUT/DELETE | `/products/:id`                        | Get / Update / Delete  |
| POST           | `/products/:id/image`                  | Upload product image   |
| GET            | `/products/:id/stock`                  | Product stock levels   |
| GET/POST       | `/products/categories`                 | Categories             |
| GET/POST       | `/products/sub-categories`             | Sub-categories         |
| GET/POST       | `/products/brands`                     | Brands                 |
| GET/POST       | `/products/units`                      | Units                  |
| POST           | `/products/stock/opening`              | Set opening stock      |
| POST           | `/products/stock/adjust`               | Adjust stock           |
| GET/POST       | `/products/stock/transfers`            | Stock transfers        |
| PATCH          | `/products/stock/transfers/:id/status` | Update transfer status |
| GET            | `/products/stock/alerts`               | Low stock alerts       |
| GET/POST       | `/products/damages`                    | Damage records         |

### Sales

| Method   | Endpoint             | Description        |
| -------- | -------------------- | ------------------ |
| GET/POST | `/sales`             | List / Create sale |
| GET/PUT  | `/sales/:id`         | Get / Update sale  |
| POST     | `/sales/:id/payment` | Record payment     |
| POST     | `/sales/:id/return`  | Process return     |
| GET      | `/sales/returns`     | All sale returns   |

### Purchases

| Method   | Endpoint                 | Description            |
| -------- | ------------------------ | ---------------------- |
| GET/POST | `/purchases`             | List / Create purchase |
| GET/PUT  | `/purchases/:id`         | Get / Update purchase  |
| POST     | `/purchases/:id/payment` | Record payment         |
| POST     | `/purchases/:id/return`  | Process return         |
| GET      | `/purchases/returns`     | All purchase returns   |

### POS

| Method | Endpoint        | Description                        |
| ------ | --------------- | ---------------------------------- |
| GET    | `/pos/search`   | Search products (name/barcode/SKU) |
| GET    | `/pos/held`     | Get held sales                     |
| POST   | `/pos/hold`     | Hold a sale                        |
| POST   | `/pos/checkout` | Quick POS checkout                 |

### Payments

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| GET    | `/payments`          | List all payments |
| POST   | `/payments/customer` | Customer payment  |
| POST   | `/payments/supplier` | Supplier payment  |

### Accounts

| Method         | Endpoint                  | Description               |
| -------------- | ------------------------- | ------------------------- |
| GET/POST       | `/accounts`               | List / Create account     |
| GET/PUT/DELETE | `/accounts/:id`           | Get / Update / Delete     |
| POST           | `/accounts/deposit`       | Deposit                   |
| POST           | `/accounts/withdraw`      | Withdrawal                |
| POST           | `/accounts/transfer`      | Transfer between accounts |
| GET            | `/accounts/:id/statement` | Account statement         |
| GET            | `/accounts/transactions`  | All transactions          |

### Expenses

| Method         | Endpoint        | Description                             |
| -------------- | --------------- | --------------------------------------- |
| GET/POST       | `/expenses`     | List / Create (supports voucher upload) |
| GET/PUT/DELETE | `/expenses/:id` | Get / Update / Delete                   |

### Loans & Capital

| Method         | Endpoint                   | Description              |
| -------------- | -------------------------- | ------------------------ |
| GET/POST       | `/loans`                   | List / Create loan       |
| GET/PUT/DELETE | `/loans/:id`               | Get / Update / Delete    |
| POST           | `/loans/:id/payment`       | Loan payment             |
| GET/POST       | `/capital`                 | List / Create capital    |
| POST           | `/capital/:id/transaction` | Investment or withdrawal |

### Reports & Dashboard

| Method | Endpoint                 | Description                            |
| ------ | ------------------------ | -------------------------------------- |
| GET    | `/reports/dashboard`     | Full dashboard (supports period param) |
| GET    | `/reports/daily-summary` | Daily summary                          |
| GET    | `/reports/sales`         | Sales report                           |
| GET    | `/reports/purchases`     | Purchase report                        |
| GET    | `/reports/profit`        | Profit & loss                          |
| GET    | `/reports/stock`         | Stock report                           |
| GET    | `/reports/ledger`        | Ledger report                          |
| GET    | `/reports/expenses`      | Expense report                         |
| GET    | `/reports/cash-flow`     | Cash flow                              |
| GET    | `/reports/best-selling`  | Best selling products                  |
| GET    | `/reports/product-sales` | Product-wise sales                     |
| GET    | `/reports/customer-dues` | Customer dues                          |
| GET    | `/reports/supplier-dues` | Supplier dues                          |
| GET    | `/reports/damages`       | Damage report                          |
| GET    | `/reports/transfers`     | Stock transfer report                  |

### Export (CSV)

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| GET    | `/export/customers` | Export customers CSV |
| GET    | `/export/suppliers` | Export suppliers CSV |
| GET    | `/export/products`  | Export products CSV  |
| GET    | `/export/sales`     | Export sales CSV     |
| GET    | `/export/purchases` | Export purchases CSV |
| GET    | `/export/stock`     | Export stock CSV     |
| GET    | `/export/ledger`    | Export ledger CSV    |

### Print & Barcode

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| GET    | `/print/invoice/sale/:id`     | Sale invoice data               |
| GET    | `/print/invoice/purchase/:id` | Purchase invoice data           |
| GET    | `/print/barcode`              | Barcode data for label printing |

### SMS

| Method | Endpoint    | Description |
| ------ | ----------- | ----------- |
| POST   | `/sms/send` | Send SMS    |
| POST   | `/sms/bulk` | Bulk SMS    |
| GET    | `/sms/logs` | SMS logs    |

### Settings

| Method | Endpoint         | Description          |
| ------ | ---------------- | -------------------- |
| GET    | `/settings`      | Get all settings     |
| POST   | `/settings`      | Upsert setting       |
| POST   | `/settings/bulk` | Bulk update settings |
| DELETE | `/settings/:key` | Delete setting       |

### Audit & Notifications

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| GET    | `/audit`                  | Audit logs (admin only) |
| GET    | `/notifications`          | User notifications      |
| PATCH  | `/notifications/:id/read` | Mark as read            |
| PATCH  | `/notifications/read-all` | Mark all as read        |

---

## Response Format

All APIs return a consistent JSON structure:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Paginated
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}

// Error
{
  "success": false,
  "message": "Error description"
}

// Validation Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## Authentication

All routes (except `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, and `/health`) require a JWT token:

```
Authorization: Bearer <token>
```

---

## User Roles

| Role                | Description                        |
| ------------------- | ---------------------------------- |
| `SUPER_ADMIN`       | Full access to everything          |
| `ADMIN`             | Full access to everything          |
| `BRANCH_MANAGER`    | Manage branch operations           |
| `SALES_MANAGER`     | Manage sales team                  |
| `SALESMAN`          | Create sales, view products        |
| `ACCOUNTANT`        | Payments, expenses, loans, reports |
| `INVENTORY_MANAGER` | Stock management                   |
| `PURCHASE_MANAGER`  | Purchase management                |
| `CASHIER`           | POS and payment recording          |
| `EMPLOYEE`          | Basic access                       |

---

## File Uploads

Files are stored on the server in the `uploads/` folder:

| Type            | Endpoint                          | Field     | Folder              |
| --------------- | --------------------------------- | --------- | ------------------- |
| Product image   | `POST /products/:id/image`        | `image`   | `uploads/products/` |
| User profile    | `POST /users/:id/profile-picture` | `image`   | `uploads/profiles/` |
| Expense voucher | `POST /expenses`                  | `voucher` | `uploads/vouchers/` |

Files are served statically at:

```
http://localhost:5000/uploads/products/filename.jpg
```

The `image` field in the database stores the path as `/uploads/products/filename.jpg` so the frontend can directly use it as `<img src={product.image} />`.

---

## Database Schema

50+ models organized across 10 schema files:

- **Users** — User, RolePermission, LoginHistory, AuditLog
- **Branches** — Branch, Warehouse
- **Customers** — Customer, Supplier, Ledger
- **Products** — Product, Category, SubCategory, Brand, Unit, Stock, StockAdjustment, StockTransfer, StockTransferItem, Damage
- **Sales** — Sale, SaleItem, SaleReturn, SaleReturnItem
- **Purchases** — Purchase, PurchaseItem, PurchaseReturn, PurchaseReturnItem
- **Payments** — Payment
- **Finance** — Expense, Loan, LoanPayment, Capital, CapitalTransaction, Account, AccountTransaction, SMSLog, SystemSetting, Notification

---

## Environment Variables

See `.env.example` for all required variables.

| Variable         | Description                              |
| ---------------- | ---------------------------------------- |
| `DATABASE_URL`   | Pooled Prisma Postgres connection string |
| `DIRECT_URL`     | Direct connection for migrations         |
| `JWT_SECRET`     | Secret for JWT signing (min 32 chars)    |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`)             |
| `PORT`           | Server port (default: `5000`)            |
| `CORS_ORIGIN`    | Allowed frontend origin                  |
| `FRONTEND_URL`   | Used in password reset emails            |
| `SMTP_HOST`      | Email host                               |
| `SMTP_USER`      | Email address                            |
| `SMTP_PASS`      | Email password / app password            |
| `COMPANY_NAME`   | Company name in emails                   |
