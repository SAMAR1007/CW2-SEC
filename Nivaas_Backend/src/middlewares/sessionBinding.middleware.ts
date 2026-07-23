import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { ApiError } from '../exceptions/api.error';
import { UserModel } from '../models/user.model';
import crypto from 'crypto';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
  file?: Express.Multer.File | undefined;
}

const hashUserAgent = (userAgent: string): string => {
  return crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16);
};

export const sessionBindingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies['auth-token'] || req.cookies.token;
    
    if (!token) {
      return next(); // No token, skip binding check
    }

    const decoded = verifyToken(token) as { id: string; role: string; ua?: string } | null;
    if (!decoded || typeof decoded === 'string') {
      return next();
    }

    // If token has user-agent hash, validate it
    if (decoded.ua) {
      const currentUA = hashUserAgent(req.headers['user-agent'] || '');
      if (decoded.ua !== currentUA) {
        // User-agent mismatch — flag but don't block; log for monitoring
        console.warn(`Session binding mismatch for user ${decoded.id}: expected UA hash ${decoded.ua}, got ${currentUA}`);
        
        // Update the user's last user-agent
        try {
          await UserModel.findByIdAndUpdate(decoded.id, { lastUserAgent: currentUA });
        } catch {
          // Non-critical
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export { hashUserAgent };
