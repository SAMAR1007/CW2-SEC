import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'user' | 'admin' | 'host';
  image?: string;
  wishlist: string[];
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  // Security fields
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  passwordHistory: string[];
  passwordChangedAt: Date | null;
  // MFA fields
  mfaSecret: string | null;
  mfaEnabled: boolean;
  mfaBackupCodes: string[];
  // Session binding
  lastUserAgent: string | null;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
