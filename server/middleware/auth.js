/**
 * middleware/auth.js
 * Verifies Supabase JWT Bearer tokens.
 * Demo mode is strictly restricted to local development and permanently disabled in production.
 */

import { supabaseAdmin } from '../lib/supabase.js';

const demoUser = {
  id: 'demo-user-id-001',
  email: 'demo@ventureos.local',
  app_metadata: {},
  user_metadata: {
    full_name: 'Demo Founder',
  },
};

async function requireAuth(req, res, next) {
  try {
    const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const isDemoMode = !isProduction && process.env.ENABLE_DEMO_MODE === 'true';

    const authHeader = req.headers.authorization;

    // In local development ONLY: allow demo access if ENABLE_DEMO_MODE is explicitly true
    if (isDemoMode && (!authHeader || authHeader === 'Bearer demo-token')) {
      req.user = demoUser;
      return next();
    }

    // In production or when demo mode is inactive: require a valid Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Please log in to continue.',
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token || token === 'demo-token' || token === 'undefined' || token === 'null') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'A valid authentication token is required.',
      });
    }

    if (!supabaseAdmin) {
      return res.status(503).json({
        error: 'Authentication unavailable',
        message: 'Authentication service is not configured on the server.',
      });
    }

    // Verify the JWT token with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Your session is invalid or has expired. Please log in again.',
      });
    }

    req.user = data.user;
    return next();
  } catch (err) {
    console.error('[Auth Middleware] Error:', err.message);

    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An unexpected authentication error occurred.',
    });
  }
}

export { requireAuth };
