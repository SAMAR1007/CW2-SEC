import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import multer from 'multer';
import helmet from 'helmet';
import authRoutes from './routes/auth.route';
import adminRoutes from './routes/admin.route';
import hostRoutes from './routes/host.route';
import erdRoutes from './routes/erd.route';
import paymentRoutes from './routes/payment.route';
import messageRoutes from './routes/message.route';
import notificationRoutes from './routes/notification.route';
import wishlistRoutes from './routes/wishlist.route';
import reportRoutes from './routes/report.route';
import webauthnRoutes from './routes/webauthn.route';
import {
  generalLimiter,
  adminLimiter,
} from './middlewares/rateLimiter.middleware';
import { sessionBindingMiddleware } from './middlewares/sessionBinding.middleware';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Cookie parser
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Session binding check (non-blocking, logs mismatches)
app.use(sessionBindingMiddleware);

// General rate limiting
app.use('/api', generalLimiter);

// Admin rate limiting
app.use('/api/admin', adminLimiter);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/erd', erdRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/webauthn', webauthnRoutes);

// Global error handler — catches multer errors, uncaught exceptions, etc.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('🔥 Unhandled error:', err);
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: `Upload error: ${err.message}` });
    return;
  }
  res.status(500).json({ message: err.message || 'Internal server error' });
});

export default app;
