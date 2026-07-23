import { Schema, model, Types } from 'mongoose';

const adminProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    assignedSince: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true }
);

export interface IAdminProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  assignedSince: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const AdminProfileModel = model('AdminProfile', adminProfileSchema);
