import {
  findUserByEmail,
  findUserByPhone,
  createUser,
  findUserById,
  updateUserById,
} from '../repositories/user.repository';
import { findHostProfileByUserId } from '../repositories/hostProfile.repository';
import { hashPassword, comparePassword } from '../utils/hash.util';
import { generateToken, verifyToken } from '../lib/jwt';
import { ApiError } from '../exceptions/api.error';
import { sendEmail } from '../utils/email.util';
import { createAuditLog } from './auditLog.service';
import { UserModel } from '../models/user.model';
import { hashUserAgent } from '../middlewares/sessionBinding.middleware';
import { verifyRecaptchaToken } from './captcha.service';
import crypto from 'crypto';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const PASSWORD_HISTORY_LIMIT = 5;
const PASSWORD_EXPIRY_DAYS = 90; // Days before password expires
const ADMIN_PASSWORD_EXPIRY_DAYS = 60;

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getLockoutDuration = (failedAttempts: number): number => {
  if (failedAttempts >= 15) return 24 * 60;
  if (failedAttempts >= 10) return 60;
  return LOCKOUT_DURATION_MINUTES;
};

const isPasswordExpired = (passwordChangedAt: Date | null | undefined, role: string): boolean => {
  if (!passwordChangedAt) return true;
  const expiryDays = role === 'admin' ? ADMIN_PASSWORD_EXPIRY_DAYS : PASSWORD_EXPIRY_DAYS;
  const expiryDate = new Date(passwordChangedAt);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  return expiryDate < new Date();
};

export const registerUser = async (payload: any, req?: any) => {
  // Verify CAPTCHA if token provided
  if (payload.recaptchaToken) {
    const captchaResult = await verifyRecaptchaToken(payload.recaptchaToken, 'register');
    if (!captchaResult.valid) {
      throw new ApiError(`CAPTCHA verification failed: ${captchaResult.message}`, 400);
    }
  }

  const emailExists = await findUserByEmail(payload.email);
  if (emailExists) {
    throw new ApiError('Email already exists', 409);
  }

  const phoneExists = await findUserByPhone(payload.phoneNumber);
  if (phoneExists) {
    throw new ApiError('Phone number already exists', 409);
  }

  const hashedPassword = await hashPassword(payload.password);

  const user = await createUser({
    name: payload.name,
    email: payload.email,
    phoneNumber: payload.phoneNumber,
    password: hashedPassword,
    role: payload.role || 'user',
  });

  // Store initial password in history
  await UserModel.findByIdAndUpdate(user._id, {
    passwordHistory: [hashedPassword],
    passwordChangedAt: new Date(),
  });

  await createAuditLog({
    userId: user._id.toString(),
    action: 'register',
    category: 'auth',
    details: `User registered with email: ${payload.email}`,
    req,
    success: true,
  });

  return user;
};

export const loginUser = async (payload: any, req?: any) => {
  // Verify CAPTCHA if token provided
  if (payload.recaptchaToken) {
    const captchaResult = await verifyRecaptchaToken(payload.recaptchaToken, 'login');
    if (!captchaResult.valid) {
      throw new ApiError(`CAPTCHA verification failed: ${captchaResult.message}`, 400);
    }
  }

  const user = await findUserByEmail(payload.email);

  if (!user) {
    await createAuditLog({
      action: 'login_failed',
      category: 'auth',
      details: `Login attempt for non-existent email: ${payload.email}`,
      req,
      success: false,
    });
    throw new ApiError('Invalid credentials', 401);
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutesRemaining = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    await createAuditLog({
      userId: user._id.toString(),
      action: 'login_failed',
      category: 'auth',
      details: `Login attempt on locked account. ${minutesRemaining} minutes remaining.`,
      req,
      success: false,
    });
    throw new ApiError(
      `Account is locked due to too many failed attempts. Try again in ${minutesRemaining} minutes.`,
      423
    );
  }

  const isMatch = await comparePassword(payload.password, user.password);
  if (!isMatch) {
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const lockDuration = getLockoutDuration(newAttempts);

    if (newAttempts >= LOCKOUT_THRESHOLD) {
      const lockedUntil = new Date(Date.now() + lockDuration * 60 * 1000);
      await UserModel.findByIdAndUpdate(user._id, {
        failedLoginAttempts: newAttempts,
        lockedUntil,
      });

      await createAuditLog({
        userId: user._id.toString(),
        action: 'account_locked',
        category: 'auth',
        details: `Account locked after ${newAttempts} failed attempts. Locked for ${lockDuration} minutes.`,
        req,
        success: false,
      });

      throw new ApiError(
        `Account locked due to too many failed attempts. Try again in ${lockDuration} minutes.`,
        423
      );
    }

    await UserModel.findByIdAndUpdate(user._id, {
      failedLoginAttempts: newAttempts,
    });

    await createAuditLog({
      userId: user._id.toString(),
      action: 'login_failed',
      category: 'auth',
      details: `Failed login attempt ${newAttempts}/${LOCKOUT_THRESHOLD}`,
      req,
      success: false,
    });

    throw new ApiError('Invalid credentials', 401);
  }

  // Check password expiry
  if (isPasswordExpired(user.passwordChangedAt, user.role)) {
    // Allow login but flag for password change
    const token = generateToken({ id: user._id, role: user.role });
    return {
      token,
      passwordExpired: true,
      message: 'Your password has expired. Please change it.',
    };
  }

  // Check MFA requirement
  if (user.mfaEnabled) {
    if (!payload.mfaCode) {
      return { mfaRequired: true, userId: user._id.toString() };
    }

    const { verifyMFACode } = await import('./mfa.service');
    const mfaValid = await verifyMFACode(user._id.toString(), payload.mfaCode);
    if (!mfaValid) {
      throw new ApiError('Invalid MFA code', 401);
    }
  }

  // Reset failed attempts on successful login
  await UserModel.findByIdAndUpdate(user._id, {
    failedLoginAttempts: 0,
    lockedUntil: null,
  });

  // Generate token with user-agent binding
  const uaHash = req ? hashUserAgent(req.headers['user-agent'] || '') : '';
  const tokenPayload: any = {
    id: user._id,
    role: user.role,
  };
  if (uaHash) {
    tokenPayload.ua = uaHash;
  }

  const token = generateToken(tokenPayload);

  await createAuditLog({
    userId: user._id.toString(),
    action: 'login',
    category: 'auth',
    details: 'Successful login',
    req,
    success: true,
  });

  return { token };
};

export const verifyUser = async (req: any) => {
  const token = req.headers?.authorization?.split(' ')[1] || req.cookies['auth-token'] || req.cookies?.token;
  if (!token) {
    throw new ApiError('No token provided', 401);
  }

  const decoded = verifyToken(token);
  if (!decoded || typeof decoded === 'string') {
    throw new ApiError('Invalid token', 401);
  }

  const user = await findUserById(decoded.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Check password expiry on verify as well
  const passwordExpired = isPasswordExpired(user.passwordChangedAt, user.role);

  const hostProfile = await findHostProfileByUserId(user._id.toString());
  const hostStatus = hostProfile
    ? {
        status: hostProfile.verificationStatus,
        rejectionReason: hostProfile.rejectionReason || null,
        isVerifiedHost: hostProfile.verificationStatus === 'verified',
      }
    : null;

  return { user, hostStatus, passwordExpired };
};

export const updateUserProfile = async (userId: string, payload: any, imagePath?: string, req?: any) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const changes: string[] = [];

  if (payload.email && payload.email !== user.email) {
    const emailExists = await findUserByEmail(payload.email);
    if (emailExists) {
      throw new ApiError('Email already exists', 409);
    }
    changes.push(`email changed to ${payload.email}`);
  }

  if (payload.phoneNumber && payload.phoneNumber !== user.phoneNumber) {
    const phoneExists = await findUserByPhone(payload.phoneNumber);
    if (phoneExists) {
      throw new ApiError('Phone number already exists', 409);
    }
    changes.push('phone number changed');
  }

  const updateData: any = {};
  
  if (payload.name) {
    updateData.name = payload.name;
    changes.push('name updated');
  }
  if (payload.email) updateData.email = payload.email;
  if (payload.phoneNumber) updateData.phoneNumber = payload.phoneNumber;

  if (payload.password) {
    const userDoc = await UserModel.findById(userId);
    if (userDoc?.passwordHistory) {
      for (const oldHash of userDoc.passwordHistory) {
        const isReused = await comparePassword(payload.password, oldHash);
        if (isReused) {
          throw new ApiError('You cannot reuse a recent password. Please choose a different password.', 400);
        }
      }
    }

    updateData.password = await hashPassword(payload.password);
    updateData.passwordChangedAt = new Date();

    const history = userDoc?.passwordHistory || [];
    history.push(updateData.password);
    if (history.length > PASSWORD_HISTORY_LIMIT) {
      history.shift();
    }
    updateData.passwordHistory = history;

    changes.push('password changed');
  }

  if (imagePath) {
    updateData.image = imagePath;
    changes.push('profile image updated');
  }

  const updated = await updateUserById(userId, updateData);

  if (changes.length > 0) {
    await createAuditLog({
      userId,
      action: 'profile_update',
      category: 'profile',
      details: changes.join('; '),
      req,
      success: true,
    });
  }

  return updated;
};

export const requestPasswordReset = async (email: string, req?: any) => {
  const user = await findUserByEmail(email);
  if (!user) {
    await createAuditLog({
      action: 'password_reset_request',
      category: 'auth',
      details: `Password reset requested for non-existent email: ${email}`,
      req,
      success: false,
    });
    return { message: 'If an account exists with this email, an OTP has been sent.' };
  }

  const otp = generateOtp();
  const hashedOtp = await hashPassword(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  user.resetPasswordOtp = hashedOtp;
  user.resetPasswordOtpExpires = expiresAt;
  await user.save();

  const subject = 'homecomf password reset code';
  const text = `homecomf: Your OTP code is ${otp}. It expires in 10 minutes.`;
  const html = `
    <div style="background:#f9fafb;padding:24px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #f1f5f9;overflow:hidden;">
        <div style="background:#FF5A1F;padding:20px 24px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:0.3px;">homecomf</h1>
        </div>
        <div style="padding:24px;color:#0f172a;">
          <h2 style="margin:0 0 8px;font-size:18px;">Reset your password</h2>
          <p style="margin:0 0 16px;color:#475569;">Use the OTP below to reset your password. This code expires in 10 minutes.</p>
          <div style="display:inline-block;background:#FFF7ED;border:1px solid #FED7AA;color:#9A3412;padding:12px 16px;border-radius:12px;font-size:20px;font-weight:700;letter-spacing:2px;">
            ${otp}
          </div>
          <p style="margin:16px 0 0;color:#64748b;font-size:12px;">If you didn't request this, you can ignore this email.</p>
        </div>
        <div style="padding:16px 24px;background:#f8fafc;color:#94a3b8;font-size:12px;">
          Sent by homecomf
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: user.email, subject, text, html });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new ApiError('Failed to send OTP email. Please try again.', 500);
  }

  await createAuditLog({
    userId: user._id.toString(),
    action: 'password_reset_request',
    category: 'auth',
    details: 'Password reset OTP sent',
    req,
    success: true,
  });

  return { message: 'If an account exists with this email, an OTP has been sent.' };
};

export const resetPassword = async (email: string, otp: string, newPassword: string, req?: any) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError('Invalid or expired reset request', 400);
  }

  if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
    throw new ApiError('OTP not requested', 400);
  }

  if (user.resetPasswordOtpExpires.getTime() < Date.now()) {
    throw new ApiError('OTP expired', 400);
  }

  const isMatch = await comparePassword(otp, user.resetPasswordOtp);
  if (!isMatch) {
    throw new ApiError('Invalid OTP', 400);
  }

  const userDoc = await UserModel.findById(user._id);
  if (userDoc?.passwordHistory) {
    for (const oldHash of userDoc.passwordHistory) {
      const isReused = await comparePassword(newPassword, oldHash);
      if (isReused) {
        throw new ApiError('You cannot reuse a recent password.', 400);
      }
    }
  }

  const hashedPassword = await hashPassword(newPassword);

  const history = userDoc?.passwordHistory || [];
  history.push(hashedPassword);
  if (history.length > PASSWORD_HISTORY_LIMIT) {
    history.shift();
  }

  user.password = hashedPassword;
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpires = undefined;
  user.passwordHistory = history;
  user.passwordChangedAt = new Date();
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  await createAuditLog({
    userId: user._id.toString(),
    action: 'password_reset',
    category: 'auth',
    details: 'Password reset completed',
    req,
    success: true,
  });

  return { message: 'Password reset successful' };
};

// Data export
export const exportUserData = async (userId: string, req?: any) => {
  const user = await UserModel.findById(userId)
    .select('-password -passwordHistory -mfaSecret -mfaBackupCodes -resetPasswordOtp -resetPasswordOtpExpires')
    .lean();

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const { BookingModel } = await import('../models/booking.model');
  const bookings = await BookingModel.find({ userId }).lean();

  const { ReviewModel } = await import('../models/review.model');
  const reviews = await ReviewModel.find({ userId }).lean();

  await createAuditLog({
    userId,
    action: 'data_export',
    category: 'data',
    details: 'User exported their personal data',
    req,
    success: true,
  });

  return {
    profile: user,
    bookings,
    reviews,
    exportedAt: new Date().toISOString(),
  };
};

// Data import
export const importUserData = async (userId: string, importData: any, req?: any) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (!importData || typeof importData !== 'object') {
    throw new ApiError('Invalid import data format', 400);
  }

  const updates: Record<string, unknown> = {};
  const changes: string[] = [];

  // Only allow importing specific fields (prevent privilege escalation)
  if (importData.name && typeof importData.name === 'string') {
    updates.name = importData.name.trim();
    changes.push('name');
  }

  if (importData.phoneNumber && typeof importData.phoneNumber === 'string') {
    // Check uniqueness
    const phoneExists = await findUserByPhone(importData.phoneNumber);
    if (phoneExists && phoneExists._id.toString() !== userId) {
      throw new ApiError('Phone number already in use', 409);
    }
    updates.phoneNumber = importData.phoneNumber.trim();
    changes.push('phone number');
  }

  // Import wishlist items if provided
  if (Array.isArray(importData.wishlist)) {
    updates.wishlist = importData.wishlist.filter((id: unknown) => typeof id === 'string');
    changes.push('wishlist');
  }

  if (changes.length > 0) {
    await updateUserById(userId, updates);
  }

  await createAuditLog({
    userId,
    action: 'data_import',
    category: 'data',
    details: `User imported data: ${changes.join(', ')}`,
    req,
    success: true,
  });

  return {
    message: 'Data imported successfully',
    imported: changes,
  };
};
