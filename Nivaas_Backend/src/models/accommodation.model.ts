import { Schema, model, Types } from 'mongoose';

const accommodationSchema = new Schema(
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
    location: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    weekendPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    weekendPremium: {
      type: Number,
      default: 0,
      min: 0,
      max: 99,
    },
    description: {
      type: String,
      default: '',
    },
    highlights: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    standoutAmenities: {
      type: [String],
      default: [],
    },
    safetyItems: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    maxGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 1,
    },
    beds: {
      type: Number,
      required: true,
      min: 1,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 1,
    },
    bookingType: {
      type: String,
      enum: ['instant'],
      default: 'instant',
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
    },
  },
  { timestamps: true }
);

accommodationSchema.index({ hostId: 1, createdAt: -1 });
accommodationSchema.index({ location: 1 });

export interface IAccommodationDocument {
  _id: Types.ObjectId;
  hostId: Types.ObjectId;
  title: string;
  location: string;
  price: number;
  weekendPrice?: number;
  weekendPremium?: number;
  description: string;
  highlights?: string[];
  amenities: string[];
  standoutAmenities?: string[];
  safetyItems?: string[];
  images: string[];
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  bookingType?: 'instant';
  residentialAddress?: {
    country: string;
    street: string;
    apt: string;
    city: string;
    province: string;
    postalCode: string;
  };
  isPublished?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const AccommodationModel = model('Accommodation', accommodationSchema);
