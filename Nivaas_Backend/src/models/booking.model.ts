import { Schema, model, Types } from 'mongoose';

const bookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accommodationId: {
      type: Schema.Types.ObjectId,
      ref: 'Accommodation',
      required: false,
      index: true,
    },
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Experience',
      required: false,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ accommodationId: 1, experienceId: 1 });

export interface IBookingDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accommodationId?: Types.ObjectId;
  experienceId?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export const BookingModel = model('Booking', bookingSchema);
