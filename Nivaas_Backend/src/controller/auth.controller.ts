import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  verifyUser,
  updateUserProfile,
  requestPasswordReset,
  resetPassword,
  exportUserData,
  importUserData,
} from '../services/auth.service';
import { ApiError } from '../exceptions/api.error';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body, req);
    res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = await loginUser(req.body, req);

    if (data && 'mfaRequired' in data) {
      res.status(200).json({
        message: 'MFA code required',
        mfaRequired: true,
        userId: (data as any).userId,
      });
      return;
    }

    if (data && 'passwordExpired' in data) {
      res.status(200).json({
        message: (data as any).message,
        token: (data as any).token,
        passwordExpired: true,
      });
      return;
    }

    res.status(200).json({
      message: 'Login successful',
      data,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const { user, hostStatus, passwordExpired } = await verifyUser(req);
    res.status(200).json({
      message: 'Token verified',
      user,
      hostStatus,
      passwordExpired,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    const multerError = (req as any).multerError as string | undefined;
    const imagePath = req.file ? `/uploads/users/${req.file.filename}` : undefined;
    const user = await updateUserProfile(userId, req.body, imagePath, req);
    res.status(200).json({
      message: 'Profile updated successfully',
      user,
      ...(multerError ? { imageError: multerError } : {}),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError('Email is required', 400);
    const result = await requestPasswordReset(email, req);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      throw new ApiError('Email, OTP, and password are required', 400);
    }
    const result = await resetPassword(email, otp, password, req);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// --- MFA Endpoints ---

export const generateMFA = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Authentication required', 401);
    const { generateMFASecret, generateOTPAuthURL } = await import('../services/mfa.service');
    const { UserModel } = await import('../models/user.model');
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError('User not found', 404);
    const secret = generateMFASecret();
    const otpauthUrl = generateOTPAuthURL(user.email, secret);
    res.status(200).json({ message: 'MFA setup initiated', secret, otpauthUrl });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const enableMFA = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Authentication required', 401);
    const { otpToken, secret } = req.body;
    if (!otpToken || !secret) throw new ApiError('OTP token and secret are required', 400);
    const { enableMFA: enableMFAService } = await import('../services/mfa.service');
    const result = await enableMFAService(userId, otpToken, secret);
    res.status(200).json({ message: 'MFA enabled successfully', backupCodes: result.backupCodes });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const disableMFA = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Authentication required', 401);
    const { password } = req.body;
    if (!password) throw new ApiError('Password is required to disable MFA', 400);
    const { disableMFA: disableMFAService } = await import('../services/mfa.service');
    const result = await disableMFAService(userId, password);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// --- Data Export & Import ---

export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Authentication required', 401);
    const data = await exportUserData(userId, req);
    res.status(200).json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const importData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError('Authentication required', 401);
    const result = await importUserData(userId, req.body, req);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// --- Audit Log Viewer (Admin) ---

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') throw new ApiError('Admin access required', 403);
    const { listAuditLogs } = await import('../services/auditLog.service');
    const { limit, userId, category, action, skip } = req.query as Record<string, string>;
    const result = await listAuditLogs({
      limit: limit ? parseInt(limit) : undefined,
      userId,
      category,
      action,
      skip: skip ? parseInt(skip) : undefined,
    });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
