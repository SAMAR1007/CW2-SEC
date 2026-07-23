import { Schema, model, Types } from 'mongoose';

const reportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporterRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
      default: 'user',
    },
    reportType: {
      type: String,
      enum: ['stay', 'experience', 'host'],
      required: true,
    },
    itemId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    itemTitle: {
      type: String,
      trim: true,
      default: null,
    },
    hostName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    problem: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
      index: true,
    },
    sourcePlatform: {
      type: String,
      enum: ['web', 'mobile', 'unknown'],
      default: 'unknown',
      index: true,
    },
  },
  { timestamps: true }
);

reportSchema.index({ createdAt: -1 });

export interface IReportDocument {
  _id: Types.ObjectId;
  reporterId: Types.ObjectId;
  reporterRole: 'user' | 'admin';
  reportType: 'stay' | 'experience' | 'host';
  itemId: string | null;
  itemTitle: string | null;
  hostName: string;
  location: string;
  problem: string;
  status: 'open' | 'resolved';
  sourcePlatform: 'web' | 'mobile' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

export const ReportModel = model('Report', reportSchema);
