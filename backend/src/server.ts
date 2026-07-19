import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import healthRoutes from './routes/health.routes';
import candidateRoutes from './routes/candidate.routes';
import applicationRoutes from './routes/application.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import path from 'path';

const app = express();

// Security Middlewares
app.use(helmet());

// CORS configuration - dynamic based on ALLOWED_ORIGINS env
const origins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use(limiter);

// Parsers
app.use(express.json());
app.use(cookieParser());

// Root endpoint for simple checks
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the HireSense AI API',
    version: '1.0.0',
  });
});

// App Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Global Error Handler
app.use(errorHandler);

// Start server if not running tests
if (env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}
export default app;
