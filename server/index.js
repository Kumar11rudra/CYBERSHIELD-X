require('dotenv').config();
const crypto = require('crypto');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./utils/database');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

const { isEmailDeliveryConfigured, isEmailPreviewModeEnabled } = require('./services/emailAlerts');

const { activeStorageProvider } = require('./controllers/chatbot/chatbotController');
const { getSecurityModule } = require('./services/securityComposition');
getSecurityModule({ activeStorageProvider });

const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const historyRoutes = require('./routes/history');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const auditRoutes = require('./routes/audit');
const threatFeedRoutes = require('./routes/threatFeed');
const communityRoutes = require('./routes/community');
const toolsRoutes = require('./routes/tools');
const aiRoutes = require('./routes/ai');
const breachRoutes = require('./routes/breach');
const toolkitRoutes = require('./routes/toolkit');
const iocRoutes = require('./routes/ioc');
const reportRoutes = require('./routes/report');
const capabilityRoutes = require('./routes/capabilities');
const { ipFirewall } = require('./middleware/auth');
const logger = require('./utils/logger');
const { observabilityMiddleware, getMetrics } = require('./middleware/observability');

const isCloudflarePagesOrigin = (origin) => {
  if (typeof origin !== 'string') return false;
  return (
    /^https:\/\/[a-zA-Z0-9-]+\.pages\.dev$/.test(origin) ||
    /^https:\/\/(www\.)?cybershieldx\.in$/.test(origin)
  );
};

const getAllowedOrigins = () => {
  const allowed = [];
  ['CLIENT_URL', 'ALT_CLIENT_URL'].forEach((envKey) => {
    const val = process.env[envKey];
    if (val) {
      if (val.includes(',')) {
        allowed.push(...val.split(',').map((o) => o.trim()));
      } else {
        allowed.push(val.trim());
      }
    }
  });

  allowed.push('https://cybershieldx.pages.dev');
  allowed.push('https://cybershieldx.in');
  allowed.push('https://www.cybershieldx.in');

  if (process.env.NODE_ENV !== 'production') {
    allowed.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173'
    );
  } else if (allowed.length === 1) {
    allowed.push('https://cybershield-x.app');
  }
  return allowed;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = getAllowedOrigins();
    if (allowed.includes(origin) || isCloudflarePagesOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

const app = express();

// Trust reverse proxy (Cloudflare Pages, Render Web Service) - 1 hop
app.set('trust proxy', 1);

// ─── Request Correlation Middleware (X-Request-Id) ─────────────────────────
const REQUEST_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

app.use((req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && REQUEST_ID_REGEX.test(incomingId.trim()))
    ? incomingId.trim()
    : crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// ─── Observability (Critical for Telemetry) ──────────────────────────────────
app.use(observabilityMiddleware);

// ─── Production Hardening ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval needed for some React/Vite builds in certain envs
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*"],
      connectSrc: ["'self'", "https://*", "wss://*", "ws://*"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Request Timeout (15s)
app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    res.status(408).send('Request Timeout');
  });
  next();
});

// Global IP Firewall
app.use(ipFirewall);
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

app.set('io', io);

const isProduction = process.env.NODE_ENV === 'production';

const buildStatusPayload = () => {
  const databaseOnline = mongoose.connection.readyState === 1;
  const emailConfigured = isEmailDeliveryConfigured();
  const emailPreview = isEmailPreviewModeEnabled() || (!emailConfigured && !isProduction);
  const threatIntelConfigured = Boolean(process.env.UrlEngine_API_KEY || process.env.UrlEngine_API_KEY);

  const services = [
    {
      id: 'backend',
      label: 'Backend API',
      status: 'online',
      detail: 'Express API is accepting requests.',
    },
    {
      id: 'database',
      label: 'MongoDB',
      status: databaseOnline ? 'online' : 'offline',
      detail: databaseOnline ? 'Database connection is active.' : 'Database connection is not ready.',
    },
    {
      id: 'email',
      label: 'Email Alerts',
      status: emailConfigured ? 'configured' : (emailPreview ? 'preview' : 'missing'),
      detail: emailConfigured
        ? 'SMTP delivery is configured.'
        : (emailPreview ? 'Email preview mode is active.' : 'SMTP credentials are missing.'),
    },
    {
      id: 'threat-intel',
      label: 'Threat Intel',
      status: threatIntelConfigured ? 'configured' : 'missing',
      detail: threatIntelConfigured
        ? 'At least one threat intelligence provider is configured.'
        : 'External enrichment keys are not configured; fallback analysis remains available.',
    },
  ];

  const hasOffline = services.some((service) => service.status === 'offline');
  const hasMissing = services.some((service) => service.status === 'missing');

  return {
    status: hasOffline ? 'degraded' : (hasMissing ? 'partial' : 'healthy'),
    version: '4.0.0',
    time: new Date(),
    env: process.env.NODE_ENV,
    services,
  };
};

// Boot Queue Workers & Providers
require('./workers/queueProvider');

// DB Connection
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  const { startScheduler } = require('./services/cronService');
  startScheduler();
}

// compression and sanitization
app.use(compression());
app.use(mongoSanitize());
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(isProduction ? 'combined' : 'dev'));

const { createRateLimitHandler } = require('./middleware/rateLimitAnalytics');

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  handler: createRateLimitHandler('global')
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Strict for auth
  message: { error: 'Too many login/signup attempts. Try again later.' },
  handler: createRateLimitHandler('auth')
});

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // Max 10 scans per hour for free tier
  message: { error: 'Scan limit reached for this hour.' },
  handler: createRateLimitHandler('scan')
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Max 15 AI triage requests per 15 minutes per identity
  message: { error: 'Too many AI analysis requests. Please try again after 15 minutes.' },
  handler: createRateLimitHandler('ai')
});

// Debug Logger to track all incoming requests
app.use((req, res, next) => {
  next();
});


// Health/Status check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CyberShield X API',
    time: new Date(),
  });
});

app.get('/api/status', (req, res) => {
  res.json(buildStatusPayload());
});

// IP Firewall has been registered early. No duplicate registration here.

// CSRF Protection (Global for mutations)
// app.use(csrfProtection); // Disabled: csrfProtection is undefined

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/scan', scanLimiter, scanRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/threat-feed', threatFeedRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/breach', breachRoutes);
app.use('/api/vault', require('./routes/vault'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/membership', require('./routes/membership'));
app.use('/api/orgs', require('./routes/org'));
app.use('/api/vulnerabilities', require('./routes/vulnerability'));
app.use('/api/assets', require('./routes/asset'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/schedules', require('./routes/schedule'));
app.use('/api/toolkit', toolkitRoutes);
app.use('/api/ioc', iocRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/playbooks', require('./routes/playbook'));
app.use('/api/integrations', require('./routes/integration'));
app.use('/api/remediations', require('./routes/remediation'));
app.use('/api/health', require('./routes/health'));
app.use('/api/chatbot', require('./routes/chatbot')); // Added Chatbot route

const {
    capabilityResolver,
    scanExecutionService,
    jobManager,
    jobCancellationService
} = require('./controllers/chatbot/chatbotController');

const ExecutionController = require('./controllers/ExecutionController');
const executionController = new ExecutionController({
    scanExecutionService,
    jobManager,
    jobCancellationService,
    capabilityResolver
});
app.use('/api/execution', require('./routes/execution')(executionController));

// Capability Catalog
app.use('/api/capabilities', capabilityRoutes);

// RBAC & User Profile Aliases mapping to authRoutes
app.use('/api/users/me/profile', (req, res, next) => {
  req.url = '/me';
  authRoutes(req, res, next);
});
app.use('/api/roles', (req, res, next) => {
  req.url = '/roles';
  authRoutes(req, res, next);
});
app.use('/api/permissions', (req, res, next) => {
  req.url = '/permissions';
  authRoutes(req, res, next);
});

// ─── #15: CSP Violation Reporting Endpoint ───────────────────────────────────
app.post('/api/security/csp-violation', (req, res) => {
  if (req.body) {
    console.warn('\n🛡️ [CSP VIOLATION DETECTED]', req.body);
  }
  res.status(204).end();
});

// Honeypot handler
const honeypotHandler = async (req, res) => {
  console.warn(`\n🛑 [HONEYPOT TRIPPED] Path: ${req.path}`);
  res.status(404).json({ error: 'Endpoint not found' });
};
app.all('/wp-login.php', honeypotHandler);
app.all('/.env', honeypotHandler);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
} else {
  app.use('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Route not found' });
    } else {
      // In dev, if it's not /api, it might be the react dev server hitting the wrong port
      res.status(404).send('Not Found');
    }
  });
}

// ─── Production Error Handling & Resilience ────────────────────────────────
app.use((err, req, res, next) => {
  const requestId = req.id || req.headers?.['x-request-id'] || 'unknown';
  logger.error(`[RUNTIME ERROR] [${requestId}] ${err.message}`, { stack: err.stack, path: req.path, requestId });
  
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: isProduction ? 'Internal Intelligence Error' : err.message,
    code: status === 500 ? 'NEXUS_CORE_FAULT' : 'REQUEST_INVALID',
    requestId
  });
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
let isShuttingDown = false;

const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`[SHUTDOWN] Signal ${signal} received. Powering down Nexus Core...`);
  
  httpServer.close(async () => {
    logger.info('[SHUTDOWN] HTTP/Socket.io gateways closed.');
    try {
      await mongoose.connection.close();
      logger.info('[SHUTDOWN] Database cluster disconnected. Termination complete.');
    } catch (err) {
      logger.error('[SHUTDOWN] Error closing database:', err.message);
    }
    process.exit(exitCode);
  });
  
  setTimeout(() => {
    logger.error('[SHUTDOWN] Force terminating process after timeout.');
    process.exit(exitCode || 1);
  }, 10000).unref();
};

// ─── Process-Level Crash Prevention & Resilience ────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[PROCESS CRITICAL] Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (err) => {
  logger.error('[PROCESS CRITICAL] Uncaught Exception:', {
    message: err.message,
    stack: err.stack,
  });
  shutdown('uncaughtException', 1);
});

process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));

const PORT = Number(process.env.PORT) || 3001;
if (require.main === module) {
  // Bind to 0.0.0.0 for cloud platforms (Render, Railway, etc.)
  // This allows external traffic to reach the server
  const HOST = '0.0.0.0';
  httpServer.listen(PORT, HOST, () => {
    logger.info(`[NEXUS-CORE] Platform active on ${HOST}:${PORT}`);
    logger.info(`[ENV] Deployment Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  });
}

module.exports = { app, httpServer, io, buildStatusPayload };
