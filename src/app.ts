import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import branchRoutes from './routes/branch.routes';
import customerRoutes from './routes/customer.routes';
import supplierRoutes from './routes/supplier.routes';
import productRoutes from './routes/product.routes';
import purchaseRoutes from './routes/purchase.routes';
import saleRoutes from './routes/sale.routes';
import paymentRoutes from './routes/payment.routes';
import expenseRoutes from './routes/expense.routes';
import loanRoutes from './routes/loan.routes';
import reportRoutes from './routes/report.routes';
import smsRoutes from './routes/sms.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api', loanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sms', smsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'OK' }));

export default app;
