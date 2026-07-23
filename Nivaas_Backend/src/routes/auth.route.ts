import { Router } from 'express';
import {
  register, login, verify, updateProfile, forgotPassword,
  resetPasswordController, generateMFA, enableMFA, disableMFA,
  exportData, importData, getAuditLogs,
} from '../controller/auth.controller';
import { validate } from '../middlewares/zod.middleware';
import {
  registerDTO, loginDTO, forgotPasswordDTO, resetPasswordDTO,
} from '../dtos/auth.dto';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimiter.middleware';
import { upload } from '../config/multer';
import { Request, Response, NextFunction } from 'express';

const router = Router();

const safeUploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        (req as any).multerError = err.message || 'File upload failed';
      }
      next();
    });
  };
};

// Rate limiting on auth endpoints
router.use('/login', authLimiter);
router.use('/register', authLimiter);
router.use('/forgot-password', authLimiter);
router.use('/reset-password', authLimiter);

// Public auth routes
router.post('/register', validate(registerDTO), register);
router.post('/login', validate(loginDTO), login);
router.post('/forgot-password', validate(forgotPasswordDTO), forgotPassword);
router.post('/reset-password', validate(resetPasswordDTO), resetPasswordController);
router.get('/verify', verify);

// MFA routes (authenticated)
router.post('/mfa/generate', authMiddleware, generateMFA);
router.post('/mfa/enable', authMiddleware, enableMFA);
router.post('/mfa/disable', authMiddleware, disableMFA);

// Data export & import (authenticated)
router.get('/export', authMiddleware, exportData);
router.post('/import', authMiddleware, importData);

// Profile update (authenticated)
router.put('/:id', authMiddleware, safeUploadSingle('image'), updateProfile);

// Admin audit log viewer
router.get('/admin/audit-logs', authMiddleware, getAuditLogs);

export default router;
