import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

// Modules
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import branchRoutes from './modules/branch/branch.routes';
import customerRoutes from './modules/customer/customer.routes';
import supplierRoutes from './modules/supplier/supplier.routes';
import productRoutes from './modules/product/product.routes';
import purchaseRoutes from './modules/purchase/purchase.routes';
import saleRoutes from './modules/sale/sale.routes';
import paymentRoutes from './modules/payment/payment.routes';
import expenseRoutes from './modules/expense/expense.routes';
import loanRoutes from './modules/loan/loan.routes';
import reportRoutes from './modules/report/report.routes';
import smsRoutes from './modules/sms/sms.routes';
import printRoutes from './modules/print/print.routes';

import { errorHandler } from './middleware/error.middleware';

const app = express();

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Routes ─────────────────────────────────────────────────────────
const API = '/api';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/branches`, branchRoutes);
app.use(`${API}/customers`, customerRoutes);
app.use(`${API}/suppliers`, supplierRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/purchases`, purchaseRoutes);
app.use(`${API}/sales`, saleRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/expenses`, expenseRoutes);
app.use(`${API}`, loanRoutes);           // /api/loans and /api/capital
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/sms`, smsRoutes);
app.use(`${API}/print`, printRoutes);

// ── Health check ───────────────────────────────────────────────────
app.get(`${API}/health`, (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ── 404 handler ────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler ───────────────────────────────────────────
app.use(errorHandler);

export default app;
