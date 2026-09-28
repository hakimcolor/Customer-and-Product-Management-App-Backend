import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import config from './config/config';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import branchRoutes from './modules/branch/branch.routes';
import warehouseRoutes from './modules/warehouse/warehouse.routes';
import customerRoutes from './modules/customer/customer.routes';
import supplierRoutes from './modules/supplier/supplier.routes';
import productRoutes from './modules/product/product.routes';
import purchaseRoutes from './modules/purchase/purchase.routes';
import saleRoutes from './modules/sale/sale.routes';
import paymentRoutes from './modules/payment/payment.routes';
import expenseRoutes from './modules/expense/expense.routes';
import loanRoutes from './modules/loan/loan.routes';
import accountRoutes from './modules/accounts/accounts.routes';
import reportRoutes from './modules/report/report.routes';
import smsRoutes from './modules/sms/sms.routes';
import printRoutes from './modules/print/print.routes';
import settingsRoutes from './modules/settings/settings.routes';
import auditRoutes from './modules/audit/audit.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import exportRoutes from './modules/export/export.routes';
import posRoutes from './modules/pos/pos.routes';

import { errorHandler } from './middleware/error.middleware';

const app = express();

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Rate Limiting ──────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
});
app.use(globalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);

// ── Routes ─────────────────────────────────────────────────────────
const API = '/api/v1';

// Health check — no auth required
app.get(`${API}/health`, (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date() })
);

// Root route
app.get('/', (_req, res) =>
  res.json({
    success: true,
    message: 'Sales & Inventory ERP API',
    version: 'v1',
    docs: `http://localhost:${process.env.PORT || 5000}/api/v1/health`,
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      branches: '/api/v1/branches',
      warehouses: '/api/v1/warehouses',
      customers: '/api/v1/customers',
      suppliers: '/api/v1/suppliers',
      products: '/api/v1/products',
      purchases: '/api/v1/purchases',
      sales: '/api/v1/sales',
      payments: '/api/v1/payments',
      expenses: '/api/v1/expenses',
      loans: '/api/v1/loans',
      capital: '/api/v1/capital',
      accounts: '/api/v1/accounts',
      pos: '/api/v1/pos',
      reports: '/api/v1/reports',
      export: '/api/v1/export',
      sms: '/api/v1/sms',
      print: '/api/v1/print',
      settings: '/api/v1/settings',
      audit: '/api/v1/audit',
      notifications: '/api/v1/notifications',
    },
  })
);

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/branches`, branchRoutes);
app.use(`${API}/warehouses`, warehouseRoutes);
app.use(`${API}/customers`, customerRoutes);
app.use(`${API}/suppliers`, supplierRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/purchases`, purchaseRoutes);
app.use(`${API}/sales`, saleRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/expenses`, expenseRoutes);
app.use(`${API}/accounts`, accountRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/sms`, smsRoutes);
app.use(`${API}/print`, printRoutes);
app.use(`${API}/settings`, settingsRoutes);
app.use(`${API}/audit`, auditRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/export`, exportRoutes);
app.use(`${API}/pos`, posRoutes);
app.use(`${API}`, loanRoutes); // /api/v1/loans and /api/v1/capital — must be last

// ── 404 handler ────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// ── Global error handler ───────────────────────────────────────────
app.use(errorHandler);

export default app;
