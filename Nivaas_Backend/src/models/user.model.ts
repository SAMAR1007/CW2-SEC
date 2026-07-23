import { Schema, model } from 'mongoose';
import { IUser } from '../types/user.type';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'host'],
      default: 'user',
    },
    image: {
      type: String,
      required: false,
    },
    wishlist: {
      type: [String],
      default: [],
    },
    resetPasswordOtp: {
      type: String,
      required: false,
    },
    resetPasswordOtpExpires: {
      type: Date,
      required: false,
    },
    // Security fields
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    passwordHistory: {
      type: [String],
      default: [],
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    // MFA fields
    mfaSecret: {
      type: String,
      default: null,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaBackupCodes: {
      type: [String],
      default: [],
    },
    // Session binding
    lastUserAgent: {
      type: String,
      default: null,
    },
    // WebAuthn fields
    webauthnCredentials: {
      type: [{
        credentialId: String,
        publicKey: String,
        counter: Number,
        transports: [String],
        createdAt: Date,
      }],
      default: [],
    },
    webauthnChallenge: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>('User', userSchema);
