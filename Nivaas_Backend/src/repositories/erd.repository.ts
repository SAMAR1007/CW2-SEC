import { Types } from 'mongoose';
import { AdminProfileModel } from '../models/adminProfile.model';
import { AccommodationModel } from '../models/accommodation.model';
import { BookingModel } from '../models/booking.model';
import { ExperienceModel } from '../models/experience.model';
import { HostProfileModel } from '../models/hostProfile.model';
import { PaymentModel } from '../models/payment.model';
import { ReviewModel } from '../models/review.model';
import { UserModel } from '../models/user.model';

export const findUserByIdInERD = (userId: string) => UserModel.findById(userId);

export const createHostProfileRepo = (payload: {
  userId: string;
  address?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  bio?: string;
  idDocument?: string;
}) => {
  return HostProfileModel.create({
    userId: new Types.ObjectId(payload.userId),
    address: payload.address ?? '',
    verificationStatus: payload.verificationStatus ?? 'pending',
    bio: payload.bio ?? '',
    idDocument: payload.idDocument ?? '',
  });
};

export const listHostProfilesRepo = () =>
  HostProfileModel.find().populate('userId', 'name email phoneNumber role').sort({ createdAt: -1 });

export const findHostProfileByIdRepo = (id: string) =>
  HostProfileModel.findById(id).populate('userId', 'name email phoneNumber role');

export const findHostProfileByUserIdRepo = (userId: string) =>
  HostProfileModel.findOne({ userId: new Types.ObjectId(userId) });

export const updateHostProfileRepo = (id: string, payload: Record<string, unknown>) =>
  HostProfileModel.findByIdAndUpdate(id, payload, { new: true });

export const deleteHostProfileRepo = (id: string) => HostProfileModel.findByIdAndDelete(id);

export const createAccommodationRepo = (payload: {
  hostId: string;
  title: string;
  location: string;
  price: number;
  weekendPrice?: number;
  weekendPremium?: number;
  description?: string;
  highlights?: string[];
  amenities?: string[];
  standoutAmenities?: string[];
  safetyItems?: string[];
  images?: string[];
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
}) => {
  return AccommodationModel.create({
    hostId: new Types.ObjectId(payload.hostId),
    title: payload.title,
    location: payload.location,
    price: payload.price,
    weekendPrice: payload.weekendPrice ?? 0,
    weekendPremium: payload.weekendPremium ?? 0,
    description: payload.description ?? '',
    highlights: payload.highlights ?? [],
    amenities: payload.amenities ?? [],
    standoutAmenities: payload.standoutAmenities ?? [],
    safetyItems: payload.safetyItems ?? [],
    images: payload.images ?? [],
    maxGuests: payload.maxGuests,
    bedrooms: payload.bedrooms,
    beds: payload.beds,
    bathrooms: payload.bathrooms,
    bookingType: 'instant',
    residentialAddress: payload.residentialAddress,
    isPublished: payload.isPublished ?? false,
  });
};

export const listAccommodationsRepo = () =>
  AccommodationModel.find({ isPublished: true })
    .populate({ path: 'hostId', populate: { path: 'userId', select: 'name email' } })
    .sort({ createdAt: -1 });

export const findAccommodationsByHostIdRepo = (hostId: string) =>
  AccommodationModel.find({ hostId: new Types.ObjectId(hostId) }).sort({ createdAt: -1 });

export const findAccommodationByIdRepo = (id: string) => AccommodationModel.findById(id);

export const findAccommodationByIdWithHostRepo = (id: string) =>
  AccommodationModel.findById(id).populate({
    path: 'hostId',
    select: 'legalName userId',
    populate: { path: 'userId', select: 'name image' },
  });

export const updateAccommodationRepo = (id: string, payload: Record<string, unknown>) =>
  AccommodationModel.findByIdAndUpdate(id, payload, { new: true });

export const deleteAccommodationRepo = (id: string) => AccommodationModel.findByIdAndDelete(id);

export const createExperienceRepo = (payload: {
  hostId: string;
  title: string;
  category: string;
  price: number;
  description?: string;
  location: string;
  images?: string[];
  duration: string;
  yearsOfExperience?: number;
  maxGuests?: number;
  itinerary?: Array<{ title: string; description: string; duration: string }>;
  availableDates?: Date[];
  residentialAddress?: {
    country: string;
    street: string;
    apt: string;
    city: string;
    province: string;
    postalCode: string;
  };
  isPublished?: boolean;
}) => {
  return ExperienceModel.create({
    hostId: new Types.ObjectId(payload.hostId),
    title: payload.title,
    category: payload.category,
    price: payload.price,
    description: payload.description ?? '',
    location: payload.location,
    images: payload.images ?? [],
    duration: payload.duration,
    yearsOfExperience: payload.yearsOfExperience ?? 0,
    maxGuests: payload.maxGuests ?? 1,
    itinerary: payload.itinerary ?? [],
    availableDates: payload.availableDates ?? [],
    residentialAddress: payload.residentialAddress,
    isPublished: payload.isPublished ?? false,
  });
};

export const listExperiencesRepo = () =>
  ExperienceModel.find({ isPublished: true })
    .populate({ path: 'hostId', populate: { path: 'userId', select: 'name email' } })
    .sort({ createdAt: -1 });

export const findExperiencesByHostIdRepo = (hostId: string) =>
  ExperienceModel.find({ hostId: new Types.ObjectId(hostId) }).sort({ createdAt: -1 });

export const findExperienceByIdRepo = (id: string) => ExperienceModel.findById(id);

export const findExperienceByIdWithHostRepo = (id: string) =>
  ExperienceModel.findById(id).populate({
    path: 'hostId',
    select: 'legalName userId',
    populate: { path: 'userId', select: 'name image' },
  });

export const updateExperienceRepo = (id: string, payload: Record<string, unknown>) =>
  ExperienceModel.findByIdAndUpdate(id, payload, { new: true });

export const deleteExperienceRepo = (id: string) => ExperienceModel.findByIdAndDelete(id);

export const createBookingRepo = (payload: {
  userId: string;
  accommodationId?: string;
  experienceId?: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}) => {
  return BookingModel.create({
    userId: new Types.ObjectId(payload.userId),
    accommodationId: payload.accommodationId ? new Types.ObjectId(payload.accommodationId) : undefined,
    experienceId: payload.experienceId ? new Types.ObjectId(payload.experienceId) : undefined,
    startDate: payload.startDate,
    endDate: payload.endDate,
    totalPrice: payload.totalPrice,
    status: payload.status ?? 'pending',
  });
};

/** Only confirmed bookings (and pending bookings < 15 min old) block dates. */
const PENDING_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const findOverlappingAccommodationBookingRepo = (
  accommodationId: string,
  startDate: Date,
  endDate: Date,
) => {
  const pendingCutoff = new Date(Date.now() - PENDING_TTL_MS);
  return BookingModel.findOne({
    accommodationId: new Types.ObjectId(accommodationId),
    $or: [
      { status: 'confirmed' },
      { status: 'pending', createdAt: { $gte: pendingCutoff } },
    ],
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  });
};

export const findOverlappingExperienceBookingRepo = (
  experienceId: string,
  startDate: Date,
  endDate: Date,
) => {
  const pendingCutoff = new Date(Date.now() - PENDING_TTL_MS);
  return BookingModel.findOne({
    experienceId: new Types.ObjectId(experienceId),
    $or: [
      { status: 'confirmed' },
      { status: 'pending', createdAt: { $gte: pendingCutoff } },
    ],
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  });
};

/**
 * Return active bookings (confirmed + recent-pending) for a given listing.
 * Only exposes dates – no user details.
 */
export const findActiveBookingsForListingRepo = (listingId: string, kind: 'accommodation' | 'experience') => {
  const pendingCutoff = new Date(Date.now() - PENDING_TTL_MS);
  const filter: Record<string, unknown> = {
    $or: [
      { status: 'confirmed' },
      { status: 'pending', createdAt: { $gte: pendingCutoff } },
    ],
  };
  if (kind === 'accommodation') {
    filter.accommodationId = new Types.ObjectId(listingId);
  } else {
    filter.experienceId = new Types.ObjectId(listingId);
  }
  return BookingModel.find(filter).select('startDate endDate status').lean();
};

/** Cancel all pending bookings older than 15 minutes. */
export const cancelStalePendingBookingsRepo = async () => {
  const cutoff = new Date(Date.now() - PENDING_TTL_MS);
  const result = await BookingModel.updateMany(
    { status: 'pending', createdAt: { $lt: cutoff } },
    { $set: { status: 'cancelled' } },
  );
  return result.modifiedCount;
};

/** Cancel a specific pending booking by ID + userId (safety check). */
export const cancelPendingBookingRepo = async (bookingId: string, userId: string) => {
  return BookingModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(bookingId),
      userId: new Types.ObjectId(userId),
      status: 'pending',
    },
    { $set: { status: 'cancelled' } },
    { new: true },
  );
};

export const listBookingsRepo = () =>
  BookingModel.find()
    .populate('userId', 'name email')
    .populate('accommodationId', 'title location')
    .populate('experienceId', 'title location category')
    .sort({ createdAt: -1 });

export const listBookingsByUserRepo = (userId: string) =>
  BookingModel.find({ userId: new Types.ObjectId(userId) })
    .populate('userId', 'name email')
    .populate('accommodationId', 'title location images')
    .populate('experienceId', 'title location category images')
    .sort({ createdAt: -1 });

export const findBookingByIdRepo = (id: string) => BookingModel.findById(id);

export const updateBookingRepo = (id: string, payload: Record<string, unknown>) =>
  BookingModel.findByIdAndUpdate(id, payload, { new: true });

export const deleteBookingRepo = (id: string) => BookingModel.findByIdAndDelete(id);

export const createPaymentRepo = (payload: {
  bookingId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paymentStatus?: 'pending' | 'successful' | 'failed' | 'refunded';
}) => {
  return PaymentModel.create({
    bookingId: new Types.ObjectId(payload.bookingId),
    amount: payload.amount,
    paymentMethod: payload.paymentMethod,
    transactionId: payload.transactionId,
    paymentStatus: payload.paymentStatus ?? 'pending',
  });
};

export const listPaymentsRepo = () =>
  PaymentModel.find().populate('bookingId', 'userId totalPrice status').sort({ createdAt: -1 });

export const findPaymentByIdRepo = (id: string) => PaymentModel.findById(id);

export const updatePaymentRepo = (id: string, payload: Record<string, unknown>) =>
  PaymentModel.findByIdAndUpdate(id, payload, { new: true });

export const deletePaymentRepo = (id: string) => PaymentModel.findByIdAndDelete(id);

export const findPaymentByTransactionIdRepo = (transactionId: string) =>
  PaymentModel.findOne({ transactionId });

export const findPaymentByBookingIdRepo = (bookingId: string) =>
  PaymentModel.findOne({ bookingId: new Types.ObjectId(bookingId) });

export const createReviewRepo = (payload: {
  userId: string;
  accommodationId?: string;
  experienceId?: string;
  rating: number;
  comment?: string;
}) => {
  return ReviewModel.create({
    userId: new Types.ObjectId(payload.userId),
    accommodationId: payload.accommodationId ? new Types.ObjectId(payload.accommodationId) : undefined,
    experienceId: payload.experienceId ? new Types.ObjectId(payload.experienceId) : undefined,
    rating: payload.rating,
    comment: payload.comment ?? '',
  });
};

export const listReviewsRepo = () =>
  ReviewModel.find()
    .populate('userId', 'name email image')
    .populate('accommodationId', 'title')
    .populate('experienceId', 'title')
    .sort({ createdAt: -1 });

export const findReviewByIdRepo = (id: string) => ReviewModel.findById(id);

export const updateReviewRepo = (id: string, payload: Record<string, unknown>) =>
  ReviewModel.findByIdAndUpdate(id, payload, { new: true });

export const deleteReviewRepo = (id: string) => ReviewModel.findByIdAndDelete(id);

export const createAdminProfileRepo = (payload: { userId: string; assignedSince?: Date }) => {
  return AdminProfileModel.create({
    userId: new Types.ObjectId(payload.userId),
    assignedSince: payload.assignedSince ?? new Date(),
  });
};

export const listAdminProfilesRepo = () =>
  AdminProfileModel.find().populate('userId', 'name email phoneNumber role').sort({ createdAt: -1 });

export const findAdminProfileByIdRepo = (id: string) => AdminProfileModel.findById(id);

export const findAdminProfileByUserIdRepo = (userId: string) =>
  AdminProfileModel.findOne({ userId: new Types.ObjectId(userId) });

export const updateAdminProfileRepo = (id: string, payload: Record<string, unknown>) =>
  AdminProfileModel.findByIdAndUpdate(id, payload, { new: true });

export const deleteAdminProfileRepo = (id: string) => AdminProfileModel.findByIdAndDelete(id);
