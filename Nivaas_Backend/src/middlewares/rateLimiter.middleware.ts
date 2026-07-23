import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const isTestEnvironment = process.env.NODE_ENV === 'test';

// Helper to skip rate limiting in test environment
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: { message: string };
  keyGenerator?: (req: Request) => string;
}) => {
  if (isTestEnvironment) {
    // Return a no-op middleware in test environment
    return (_req: Request, _res: Response, next: () => void) => next();
  }
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: options.message,
    ...(options.keyGenerator && { keyGenerator: options.keyGenerator }),
  });
};

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

export const paymentLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    message: 'Too many payment requests. Please slow down.',
  },
});

export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    message: 'Too many requests. Please try again later.',
  },
});

export const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    message: 'Too many admin requests. Please slow down.',
  },
});
