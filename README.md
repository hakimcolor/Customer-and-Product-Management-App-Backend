# Sales, Inventory & Accounts ERP — Backend

A complete, production-ready ERP backend built with Node.js, TypeScript, Express, PostgreSQL, and Prisma ORM.

See [backend.md](./backend.md) for full documentation.

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your database credentials

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

Server runs at `http://localhost:5000`

Default admin: `admin@example.com` / `admin123`

---

## Scripts

```bash
npm run dev           # Start dev server with hot reload
npm run build         # Compile TypeScript to JavaScript
npm run start         # Run compiled server
npm run db:push       # Push schema changes to database
npm run db:migrate    # Run database migrations
npm run db:seed       # Seed initial data
npm run db:studio     # Open Prisma Studio
npm run db:generate   # Regenerate Prisma client
```

---

## Tech Stack

- Runtime: Node.js v20+
- Language: TypeScript 5
- Framework: Express.js 4
- Database: PostgreSQL (Prisma Postgres cloud)
- ORM: Prisma 5
- Auth: JWT
- Validation: Zod v4
- File Upload: Multer
- Email: Nodemailer
- Rate Limiting: express-rate-limit
