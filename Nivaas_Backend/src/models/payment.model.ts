import { Schema, model, Types } from 'mongoose';

const paymentSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'successful', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ bookingId: 1, createdAt: -1 });

export interface IPaymentDocument {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paymentStatus: 'pending' | 'successful' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentModel = model('Payment', paymentSchema);
