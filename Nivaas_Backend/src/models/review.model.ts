import { Schema, model, Types } from 'mongoose';

const reviewSchema = new Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ accommodationId: 1, experienceId: 1 });

export interface IReviewDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accommodationId?: Types.ObjectId;
  experienceId?: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ReviewModel = model('Review', reviewSchema);
