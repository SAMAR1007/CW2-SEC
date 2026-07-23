import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { ApiError } from '../exceptions/api.error';
import { ROLES } from '../constants/roles.constant';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

    if (!token) {
      throw new ApiError('Access denied. No token provided.', 401);
    }

    const decoded = verifyToken(token) as { id: string; role: string };

    if (decoded.role !== ROLES.ADMIN) {
      throw new ApiError('Access denied. Admin privileges required.', 403);
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(401).json({
        message: 'Invalid token',
      });
    }
  }
};
