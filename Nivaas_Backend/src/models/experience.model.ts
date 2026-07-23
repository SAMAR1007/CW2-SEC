import { Schema, model, Types } from 'mongoose';

const experienceSchema = new Schema(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'HostProfile',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxGuests: {
      type: Number,
      default: 1,
      min: 1,
    },
    itinerary: {
      type: [
        {
          title: { type: String, default: '' },
          description: { type: String, default: '' },
          duration: { type: String, default: '' },
        },
      ],
      default: [],
    },
    availableDates: {
      type: [Date],
      default: [],
    },
    residentialAddress: {
      country: { type: String, default: '' },
      street: { type: String, default: '' },
      apt: { type: String, default: '' },
      city: { type: String, default: '' },
      province: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

experienceSchema.index({ hostId: 1, createdAt: -1 });
experienceSchema.index({ category: 1, location: 1 });

export interface IExperienceDocument {
  _id: Types.ObjectId;
  hostId: Types.ObjectId;
  title: string;
  category: string;
  price: number;
  description: string;
  location: string;
  images: string[];
  duration: string;
  yearsOfExperience: number;
  maxGuests: number;
  itinerary: Array<{ title: string; description: string; duration: string }>;
  availableDates: Date[];
  residentialAddress?: {
    country: string;
    street: string;
    apt: string;
    city: string;
    province: string;
    postalCode: string;
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ExperienceModel = model('Experience', experienceSchema);
