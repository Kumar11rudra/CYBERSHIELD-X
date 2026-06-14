require('dotenv').config();
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

const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const historyRoutes = require('./routes/history');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const threatFeedRoutes = require('./routes/threatFeed');
const communityRoutes = require('./routes/community');
const toolsRoutes = require('./routes/tools');
const aiRoutes = require('./routes/ai');
const breachRoutes = require('./routes/breach');
const toolkitRoutes = require('./routes/toolkit');
const { ipFirewall } = require('./middleware/auth');
const logger = require('./utils/logger');
const { observabilityMiddleware, getMetrics } = require('./middleware/observability');

const app = express();

// ─── Observability (Critical for Telemetry) ──────────────────────────────────
app.use(observabilityMiddleware);

// ─── Production Hardening ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
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
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
// ─── Observability ───────────────────────────────────────────────────────────
app.use(observabilityMiddleware);

app.set('io', io);

const isProduction = process.env.NODE_ENV === 'production';

const buildStatusPayload = () => {
  const databaseOnline = mongoose.connection.readyState === 1;
  const emailConfigured = isEmailDeliveryConfigured();
  const emailPreview = isEmailPreviewModeEnabled() || (!emailConfigured && !isProduction);
  const threatIntelConfigured = Boolean(process.env.VIRUSTOTAL_API_KEY || process.env.ABUSEIPDB_API_KEY);

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

// DB Connection
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// ─── Production Hardening ─────────────────────────────────────────────────────
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

app.use(compression());
app.use(mongoSanitize());
app.use(cors({
  origin: true, // Allow all for this specific SOC build, or process.env.CLIENT_URL
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Strict for auth
  message: { error: 'Too many login/signup attempts. Try again later.' }
});

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // Max 10 scans per hour for free tier
  message: { error: 'Scan limit reached for this hour.' }
});

// Debug Logger to track all incoming requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API REQUEST] ${req.method} ${req.path}`);
  }
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

// IP Firewall
app.use(ipFirewall);

// CSRF Protection (Global for mutations)
// app.use(csrfProtection); // Disabled: csrfProtection is undefined

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/scan', scanLimiter, scanRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/threat-feed', threatFeedRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/breach', breachRoutes);
app.use('/api/vault', require('./routes/vault'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/membership', require('./routes/membership'));
app.use('/api/toolkit', toolkitRoutes);

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
  logger.error(`[RUNTIME ERROR] ${err.message}`, { stack: err.stack, path: req.path });
  
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: isProduction ? 'Internal Intelligence Error' : err.message,
    code: status === 500 ? 'NEXUS_CORE_FAULT' : 'REQUEST_INVALID'
  });
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`[SHUTDOWN] Signal ${signal} received. Powering down Nexus Core...`);
  
  httpServer.close(async () => {
    logger.info('[SHUTDOWN] HTTP/Socket.io gateways closed.');
    try {
      await mongoose.connection.close();
      logger.info('[SHUTDOWN] Database cluster disconnected. Termination complete.');
    } catch (err) {
      logger.error('[SHUTDOWN] Error closing database:', err.message);
    }
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('[SHUTDOWN] Force terminating process after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

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
