import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { startBackgroundWorkers, stopBackgroundWorkers } from './workers';
import crypto from 'crypto';
import { db } from '@devhub/database';
import { logger } from './lib/logger';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import teamRoutes from './routes/teams';
import projectRoutes from './routes/projects';
import deploymentRoutes from './routes/deployments';
import monitoringRoutes from './routes/monitoring';
import dashboardRoutes from './routes/dashboard';
import notificationRoutes from './routes/notifications';
import repoRoutes from './routes/repositories';
import envRoutes from './routes/environments';
import commentRoutes from './routes/comments';
import auditLogRoutes from './routes/auditlogs';
import apiKeyRoutes from './routes/apikeys';
import webhookRoutes from './routes/webhooks';


const app = express();

// Security middleware
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID
app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.headers['x-request-id'] = reqId as string;
  res.setHeader('X-Request-ID', reqId);
  next();
});

// Logging
morgan.token('req-id', (req) => req.headers['x-request-id'] as string);

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan((tokens, req, res) => {
    const responseTime = tokens['response-time'](req, res);
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      content_length: tokens.res(req, res, 'content-length'),
      response_time_ms: responseTime ? parseFloat(responseTime) : null,
      req_id: tokens['req-id'](req, res),
      timestamp: new Date().toISOString(),
    });
  }));
}

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// Stricter rate limiter for login endpoint (brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 attempts per window per IP
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check (with database connectivity test)
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    await db.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }
  res.json({
    status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    database: dbStatus,
  });
});

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'DevHub API',
    version: '2.0.0',
    description: 'Complete DevOps Management Platform API',
    environment: config.nodeEnv,
    endpoints: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      teams: '/api/teams/*',
      projects: '/api/projects/*',
      deployments: '/api/deployments/*',
      monitoring: '/api/monitoring/*',
      dashboard: '/api/dashboard/*',
      notifications: '/api/notifications/*',
      repositories: '/api/repositories/*',
      environments: '/api/environments/*',
      apikeys: '/api/apikeys/*',
      webhooks: '/api/webhooks/*',
    },
    health: '/api/health',
  });
});

// Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/repositories', repoRoutes);
app.use('/api/environments', envRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/auditlogs', auditLogRoutes);
app.use('/api/apikeys', apiKeyRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`
╔═══════════════════════════════════════════════╗
║         DevHub API Server                     ║
║───────────────────────────────────────────────║
║  Status:  Running                             ║
║  Port:    ${config.port.toString().padEnd(33)}║
║  Env:     ${config.nodeEnv.padEnd(33)}║
║  API:     http://localhost:${config.port}/api  ║
╚═══════════════════════════════════════════════╝
  `);

  if (config.nodeEnv !== 'test') {
    startBackgroundWorkers();
  }
});

const SHUTDOWN_TIMEOUT_MS = 10_000;

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop background workers first to prevent new DB writes
  stopBackgroundWorkers();

  server.close(() => {
    logger.info('Server closed gracefully.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error(`Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms. Forcing exit.`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global error handlers for uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION: Shutting down...', { err });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION', { promise, reason });
  // Don't exit for unhandled rejections — log and continue.
  // In Node.js 15+ this will exit by default; we handle it gracefully here.
});

export default app;
