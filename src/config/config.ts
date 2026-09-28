import 'dotenv/config';

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] || fallback;

const config = {
  // ── Server ────────────────────────────────────────────────
  port: parseInt(optional('PORT', '5000')),
  nodeEnv: optional('NODE_ENV', 'development'),
  isDev: optional('NODE_ENV', 'development') === 'development',

  // ── Database ──────────────────────────────────────────────
  databaseUrl: required('DATABASE_URL'),
  directUrl: optional('DIRECT_URL', process.env.DATABASE_URL || ''),

  // ── JWT ───────────────────────────────────────────────────
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },

  // ── CORS ─────────────────────────────────────────────────
  corsOrigin: optional('CORS_ORIGIN', '*'),

  // ── Frontend ──────────────────────────────────────────────
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),

  // ── Email (SMTP) ──────────────────────────────────────────
  smtp: {
    host: optional('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(optional('SMTP_PORT', '587')),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
  },

  // ── Company ───────────────────────────────────────────────
  companyName: optional('COMPANY_NAME', 'My Business ERP'),

  // ── Upload ────────────────────────────────────────────────
  upload: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxDocSize: 5 * 1024 * 1024, // 5MB
    maxLogoSize: 2 * 1024 * 1024, // 2MB
  },

  // ── Rate Limiting ─────────────────────────────────────────
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    authMax: 20,
  },
} as const;

export default config;
