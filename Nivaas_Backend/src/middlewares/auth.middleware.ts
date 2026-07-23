import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { ApiError } from '../exceptions/api.error';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
  file?: Express.Multer.File | undefined;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies['auth-token'] || req.cookies.token;

    if (!token) {
      throw new ApiError('Access denied. No token provided.', 401);
    }

    const decoded = verifyToken(token) as { id: string; role: string };
    (req as AuthRequest).user = decoded;
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
