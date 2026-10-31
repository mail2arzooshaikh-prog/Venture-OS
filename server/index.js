/**
 * index.js
 * VentureOS Express API Server — main entry point.
 * Configures middleware, mounts routers, and starts listening.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import visionRouter from './routes/vision.js';
import aiRouter from './routes/ai.js';

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const rawFrontendUrl = process.env.FRONTEND_URL;

// Build set of allowed origins from FRONTEND_URL
const allowedOrigins = new Set();
if (rawFrontendUrl) {
  rawFrontendUrl.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed) allowedOrigins.add(trimmed);
  });
}

// In local development, ensure localhost ports are permitted
if (!isProduction) {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://127.0.0.1:3000');
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server, health checks) where origin is undefined
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/+$/, '');

    // In local development: support localhost or local network Wi-Fi IPs
    if (!isProduction) {
      if (/^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(cleanOrigin)) {
        return callback(null, true);
      }
    }

    // In production: strictly check configured allowed origins from FRONTEND_URL
    if (allowedOrigins.has(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: Origin '${origin}' is not authorized.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle pre-flight OPTIONS for all routes using matching CORS configuration
app.options('*', cors(corsOptions));

// ---------------------------------------------------------------------------
// Body parsers
// ---------------------------------------------------------------------------

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      gemini: !!GEMINI_API_KEY,
      supabase: !!SUPABASE_URL,
    },
  });
});

// ---------------------------------------------------------------------------
// Route mounting
// ---------------------------------------------------------------------------

app.use('/api/vision', visionRouter);
app.use('/api/ai', aiRouter);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist.',
  });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Server] Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.',
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════╗');
  console.log('  ║      VentureOS API Server v1.0.0      ║');
  console.log('  ╚═══════════════════════════════════════╝');
  console.log('');
  console.log(`  🚀 Server running on port ${PORT}`);
  console.log(`  🌐 Accepting requests from: ${FRONTEND_URL}`);
  console.log('');
  console.log('  Service status:');
  console.log(`    Supabase  : ${SUPABASE_URL ? '✅ configured' : '❌ SUPABASE_URL not set'}`);
  console.log(`    Gemini AI : ${GEMINI_API_KEY ? '✅ configured' : '❌ GEMINI_API_KEY not set'}`);
  console.log('');
});

export default app;
