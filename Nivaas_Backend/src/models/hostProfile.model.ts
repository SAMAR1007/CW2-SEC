import { Schema, model, Types } from 'mongoose';

const hostProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    legalName: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    governmentId: {
      type: String,
      trim: true,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    idDocument: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

hostProfileSchema.index({ userId: 1, verificationStatus: 1 });

export interface IHostProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  legalName: string;
  phoneNumber: string;
  address: string;
  governmentId: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason: string;
  bio: string;
  idDocument: string;
  createdAt: Date;
  updatedAt: Date;
}

export const HostProfileModel = model('HostProfile', hostProfileSchema);
