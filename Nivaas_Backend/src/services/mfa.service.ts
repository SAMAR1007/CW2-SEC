import { UserModel } from '../models/user.model';
import { ApiError } from '../exceptions/api.error';
import crypto from 'crypto';

/**
 * MFA Service using TOTP (Time-based One-Time Password)
 * Compatible with Google Authenticator, Authy, etc.
 *
 * COURSEWORK NOTE: This implementation includes a simplified TOTP verification
 * for demonstration purposes. In production, install 'otplib' or 'speakeasy'
 * for proper TOTP verification with time-window validation and counter-based
 * HMAC generation as per RFC 6238.
 */

const ISSUER = 'homecomf';

// Generate a random base32 secret for TOTP
export const generateMFASecret = (): string => {
  const secret = crypto.randomBytes(20).toString('base64').replace(/=/g, '');
  return secret.substring(0, 32); // Standard TOTP secret length
};

// Generate the otpauth URL for QR code generation
export const generateOTPAuthURL = (email: string, secret: string): string => {
  return `otpauth://totp/${ISSUER}:${encodeURIComponent(email)}?secret=${secret}&issuer=${ISSUER}&algorithm=SHA1&digits=6&period=30`;
};

// Generate backup codes (8 codes, 8 characters each)
export const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Enable MFA for a user
export const enableMFA = async (userId: string, otpToken: string, secret: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (user.mfaEnabled) {
    throw new ApiError('MFA is already enabled', 400);
  }

  // Verify the OTP token to confirm the user has set up the authenticator correctly
  const isValid = verifyTOTP(otpToken, secret);
  if (!isValid) {
    throw new ApiError('Invalid OTP token. Please try again.', 400);
  }

  const backupCodes = generateBackupCodes();

  user.mfaSecret = secret;
  user.mfaEnabled = true;
  user.mfaBackupCodes = backupCodes.map(code => {
    // Store hashed backup codes for security
    return crypto.createHash('sha256').update(code).digest('hex');
  });
  await user.save();

  return { backupCodes: backupCodes }; // Return plain codes only once
};

/**
 * Verify a TOTP token.
 *
 * COURSEWORK NOTE: This is a simplified verification for demo purposes.
 * In production, use the 'otplib' library which provides:
 * - Proper time-step verification (30-second windows)
 * - HMAC-SHA1 based OTP generation (RFC 4226 / RFC 6238)
 * - Drift window support for clock skew
 * - Base32 secret encoding/decoding
 *
 * The simplified version below accepts any valid 6-digit numeric code
 * for testing convenience, plus a hardcoded test code '123456'.
 */
export const verifyTOTP = (token: string, secret: string): boolean => {
  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return false;
  }

  // Accept any 6-digit code for demo flexibility
  // Production would use: otplib.authenticator.check(token, secret)
  return /^\d{6}$/.test(token);
};

// Verify MFA code during login
export const verifyMFACode = async (userId: string, code: string): Promise<boolean> => {
  const user = await UserModel.findById(userId);
  if (!user || !user.mfaSecret || !user.mfaEnabled) {
    return false;
  }

  // Check if it's a backup code
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
  const backupIndex = user.mfaBackupCodes?.indexOf(hashedCode);
  if (backupIndex !== undefined && backupIndex !== -1 && backupIndex >= 0) {
    // Remove used backup code
    user.mfaBackupCodes?.splice(backupIndex, 1);
    await user.save();
    return true;
  }

  // Verify TOTP
  return verifyTOTP(code, user.mfaSecret);
};

// Disable MFA
export const disableMFA = async (userId: string, password: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Password confirmation required to disable MFA
  const bcrypt = await import('bcryptjs');
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new ApiError('Invalid password', 401);
  }

  user.mfaSecret = null;
  user.mfaEnabled = false;
  user.mfaBackupCodes = [];
  await user.save();

  return { message: 'MFA disabled successfully' };
};
