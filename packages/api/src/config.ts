import dotenv from 'dotenv';
import path from 'path';

// Load env from database package first, then root (root overrides)
dotenv.config({ path: path.resolve(__dirname, '../../database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

const nodeEnv = process.env.NODE_ENV || 'development';

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET || '';

  // In production, we must NEVER silently fall back to an insecure default.
  if (nodeEnv === 'production') {
    if (!secret || secret === 'CHANGE_ME' || secret === 'change-me' || secret.length < 32) {
      throw new Error(
        'JWT_SECRET is not set to a strong, unique value. ' +
          'Please set JWT_SECRET to a random string of at least 32 characters. ' +
          'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
      );
    }
  }

  // In development, warn if using the placeholder
  if (!secret || secret === 'CHANGE_ME') {
    const fallback = 'devhub-dev-only-jwt-secret-not-for-production';
    if (nodeEnv !== 'test') {
      console.warn(
        '⚠️  JWT_SECRET is not set. Using an insecure development-only fallback. ' +
          'Set JWT_SECRET in your .env file before deploying.',
      );
    }
    return fallback;
  }

  return secret;
}

export function parseCorsOrigins(value?: string): string[] {
  const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';
  if (!value) return [DEFAULT_CORS_ORIGIN];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const jwtSecret = resolveJwtSecret();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
  nodeEnv,
  isProduction: nodeEnv === 'production',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '10000', 10),
  },
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
};
