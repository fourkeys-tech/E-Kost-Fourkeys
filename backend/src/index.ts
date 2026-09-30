import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './routes/auth';
import { propertyRoutes } from './routes/properties';
import { roomRoutes } from './routes/rooms';
import { tenantRoutes } from './routes/tenants';
import { contractRoutes } from './routes/contracts';
import { invoiceRoutes } from './routes/invoices';
import { paymentRoutes } from './routes/payments';
import { reportRoutes } from './routes/reports';
import { userRoutes } from './routes/users';
import { startCronJobs } from './jobs/cronJobs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Terlalu banyak permintaan, coba lagi nanti.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Terlalu banyak percobaan login.' },
});

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start cron jobs
startCronJobs();

app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`🚀 KostPay Backend berjalan di http://localhost:${PORT}`);
});

export default app;

// trigger restart

// trigger restart 2
