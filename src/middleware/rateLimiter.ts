import type { MiddlewareHandler } from 'hono';
import { logSecurityEvent } from '../services/securityLogger.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimiter(options: {
  maxRequests: number;
  windowMs: number;
}): MiddlewareHandler {
  const { maxRequests, windowMs } = options;

  return async (c, next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
      c.req.header('x-real-ip') ??
      'unknown';

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      logSecurityEvent('auth.rate_limited', { ip, path: c.req.path, retryAfter });
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: 'Trop de requêtes. Réessayez dans quelques instants.' },
        429,
      );
    }

    return next();
  };
}
