import { Types } from 'mongoose';
import { ApiError } from '../exceptions/api.error';
import { sendEmail } from '../utils/email.util';
import {
  createAccommodationRepo,
  createAdminProfileRepo,
  createBookingRepo,
  createExperienceRepo,
  createHostProfileRepo,
  createPaymentRepo,
  createReviewRepo,
  deleteAccommodationRepo,
  deleteAdminProfileRepo,
  deleteBookingRepo,
  deleteExperienceRepo,
  deleteHostProfileRepo,
  deletePaymentRepo,
  deleteReviewRepo,
  findAccommodationByIdRepo,
  findAccommodationByIdWithHostRepo,
  findAdminProfileByIdRepo,
  findAdminProfileByUserIdRepo,
  findBookingByIdRepo,
  findExperienceByIdRepo,
  findExperienceByIdWithHostRepo,
  findHostProfileByIdRepo,
  findHostProfileByUserIdRepo,
  findOverlappingAccommodationBookingRepo,
  findOverlappingExperienceBookingRepo,
  findPaymentByIdRepo,
  findPaymentByTransactionIdRepo,
  findReviewByIdRepo,
  findUserByIdInERD,
  listAccommodationsRepo,
  listAdminProfilesRepo,
  listBookingsRepo,
  listBookingsByUserRepo,
  listExperiencesRepo,
  listHostProfilesRepo,
  listPaymentsRepo,
  listReviewsRepo,
  updateAccommodationRepo,
  updateAdminProfileRepo,
  updateBookingRepo,
  updateExperienceRepo,
  updateHostProfileRepo,
  updatePaymentRepo,
  updateReviewRepo,
} from '../repositories/erd.repository';

const ensureValidObjectId = (id: string, fieldName: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(`Invalid ${fieldName}`, 400);
  }
};

const ensureEntityTarget = (accommodationId?: string, experienceId?: string) => {
  if ((!accommodationId && !experienceId) || (accommodationId && experienceId)) {
    throw new ApiError('Provide exactly one of accommodationId or experienceId', 400);
  }
};

export const createHostProfileService = async (payload: {
  userId: string;
  address?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  bio?: string;
  idDocument?: string;
}) => {
  ensureValidObjectId(payload.userId, 'userId');

  const user = await findUserByIdInERD(payload.userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const existing = await findHostProfileByUserIdRepo(payload.userId);
  if (existing) {
    throw new ApiError('Host profile already exists for this user', 409);
  }

  return createHostProfileRepo(payload);
};

export const listHostProfilesService = () => listHostProfilesRepo();

export const getHostProfileByIdService = async (id: string) => {
  ensureValidObjectId(id, 'host profile id');
  const hostProfile = await findHostProfileByIdRepo(id);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }
  return hostProfile;
};

export const updateHostProfileService = async (id: string, payload: Record<string, unknown>) => {
  ensureValidObjectId(id, 'host profile id');
  const updated = await updateHostProfileRepo(id, payload);
  if (!updated) {
    throw new ApiError('Host profile not found', 404);
  }
  return updated;
};

export const deleteHostProfileService = async (id: string) => {
  ensureValidObjectId(id, 'host profile id');
  const deleted = await deleteHostProfileRepo(id);
  if (!deleted) {
    throw new ApiError('Host profile not found', 404);
  }
  return { message: 'Host profile deleted successfully' };
};

export const createAccommodationService = async (payload: {
  hostId: string;
  title: string;
  location: string;
  price: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  maxGuests: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
}) => {
  ensureValidObjectId(payload.hostId, 'hostId');

  const hostProfile = await findHostProfileByIdRepo(payload.hostId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }

  return createAccommodationRepo({
    hostId: payload.hostId,
    title: payload.title,
    location: payload.location,
    price: payload.price,
    maxGuests: payload.maxGuests,
    bedrooms: payload.bedrooms ?? 1,
    beds: payload.beds ?? 1,
    bathrooms: payload.bathrooms ?? 1,
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.amenities !== undefined ? { amenities: payload.amenities } : {}),
    ...(payload.images !== undefined ? { images: payload.images } : {}),
  });
};

export const listAccommodationsService = () => listAccommodationsRepo();

export const getAccommodationByIdService = async (id: string) => {
  ensureValidObjectId(id, 'accommodation id');
  const accommodation = await findAccommodationByIdWithHostRepo(id);
  if (!accommodation) {
    throw new ApiError('Accommodation not found', 404);
  }
  return accommodation;
};

export const updateAccommodationService = async (id: string, payload: Record<string, unknown>) => {
  ensureValidObjectId(id, 'accommodation id');
  const updated = await updateAccommodationRepo(id, payload);
  if (!updated) {
    throw new ApiError('Accommodation not found', 404);
  }
  return updated;
};

export const deleteAccommodationService = async (id: string) => {
  ensureValidObjectId(id, 'accommodation id');
  const deleted = await deleteAccommodationRepo(id);
  if (!deleted) {
    throw new ApiError('Accommodation not found', 404);
  }
  return { message: 'Accommodation deleted successfully' };
};

export const createExperienceService = async (payload: {
  hostId: string;
  title: string;
  category: string;
  price: number;
  description?: string;
  location: string;
  images?: string[];
  duration: string;
}) => {
  ensureValidObjectId(payload.hostId, 'hostId');

  const hostProfile = await findHostProfileByIdRepo(payload.hostId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }

  return createExperienceRepo(payload);
};

export const listExperiencesService = () => listExperiencesRepo();

export const getExperienceByIdService = async (id: string) => {
  ensureValidObjectId(id, 'experience id');
  const experience = await findExperienceByIdWithHostRepo(id);
  if (!experience) {
    throw new ApiError('Experience not found', 404);
  }
  return experience;
};

export const updateExperienceService = async (id: string, payload: Record<string, unknown>) => {
  ensureValidObjectId(id, 'experience id');
  const updated = await updateExperienceRepo(id, payload);
  if (!updated) {
    throw new ApiError('Experience not found', 404);
  }
  return updated;
};

export const deleteExperienceService = async (id: string) => {
  ensureValidObjectId(id, 'experience id');
  const deleted = await deleteExperienceRepo(id);
  if (!deleted) {
    throw new ApiError('Experience not found', 404);
  }
  return { message: 'Experience deleted successfully' };
};

export const createBookingService = async (payload: {
  userId: string;
  accommodationId?: string;
  experienceId?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}) => {
  ensureValidObjectId(payload.userId, 'userId');
  ensureEntityTarget(payload.accommodationId, payload.experienceId);

  const user = await findUserByIdInERD(payload.userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  let accommodationDetails: Awaited<ReturnType<typeof findAccommodationByIdRepo>> | null = null;
  let experienceDetails: Awaited<ReturnType<typeof findExperienceByIdRepo>> | null = null;

  if (payload.accommodationId) {
    ensureValidObjectId(payload.accommodationId, 'accommodationId');
    const accommodation = await findAccommodationByIdRepo(payload.accommodationId);
    if (!accommodation) {
      throw new ApiError('Accommodation not found', 404);
    }
    accommodationDetails = accommodation;
  }

  if (payload.experienceId) {
    ensureValidObjectId(payload.experienceId, 'experienceId');
    const experience = await findExperienceByIdRepo(payload.experienceId);
    if (!experience) {
      throw new ApiError('Experience not found', 404);
    }
    experienceDetails = experience;
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new ApiError('Invalid booking dates', 400);
  }

  if (endDate < startDate) {
    throw new ApiError('endDate must be greater than or equal to startDate', 400);
  }

  if (payload.accommodationId) {
    const overlapping = await findOverlappingAccommodationBookingRepo(payload.accommodationId, startDate, endDate);
    if (overlapping) {
      throw new ApiError('Selected dates are not available for this stay', 409);
    }
  }

  if (payload.experienceId) {
    const overlapping = await findOverlappingExperienceBookingRepo(payload.experienceId, startDate, endDate);
    if (overlapping) {
      throw new ApiError('Selected dates are not available for this experience', 409);
    }
  }

  const booking = await createBookingRepo({
    userId: payload.userId,
    ...(payload.accommodationId ? { accommodationId: payload.accommodationId } : {}),
    ...(payload.experienceId ? { experienceId: payload.experienceId } : {}),
    startDate,
    endDate,
    totalPrice: payload.totalPrice,
    ...(payload.status ? { status: payload.status } : {}),
  });

  try {
    const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const fromDate = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const toDate = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const itemType = accommodationDetails ? 'Stay' : 'Experience';
    const itemTitle = accommodationDetails?.title || experienceDetails?.title || 'Reservation';
    const itemLocation = accommodationDetails?.location || experienceDetails?.location || '';
    const mapUrl = itemLocation
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(itemLocation)}`
      : '';

    const hostProfileId = accommodationDetails?.hostId?.toString?.() || experienceDetails?.hostId?.toString?.();
    const hostProfile = hostProfileId ? await findHostProfileByIdRepo(hostProfileId) : null;
    const hostUserId = hostProfile?.userId ? String(hostProfile.userId) : '';
    const hostUser = hostUserId ? await findUserByIdInERD(hostUserId) : null;

    const hostName = hostUser?.name || 'Host';
    const hostPhone = hostProfile?.phoneNumber || '';
    const hostEmail = hostUser?.email || '';

    await sendEmail({
      to: user.email,
      subject: `homecomf ${itemType} Reservation Confirmed`,
      text: [
        `Hi ${user.name || 'Traveler'},`,
        `Your ${itemType.toLowerCase()} reservation is confirmed.`,
        `Title: ${itemTitle}`,
        `Dates: ${fromDate} to ${toDate} (${nights} day${nights > 1 ? 's' : ''})`,
        `Location: ${itemLocation || 'N/A'}`,
        mapUrl ? `Map: ${mapUrl}` : '',
        `Host: ${hostName}`,
        hostPhone ? `Host phone: ${hostPhone}` : '',
        hostEmail ? `Host email: ${hostEmail}` : '',
        `Total: NPR ${Number(payload.totalPrice || 0).toFixed(2)}`,
      ].filter(Boolean).join('\n'),
    });

    if (hostEmail) {
      await sendEmail({
        to: hostEmail,
        subject: `homecomf: New ${itemType} reservation received`,
        text: [
          `Hi ${hostName},`,
          `You received a new ${itemType.toLowerCase()} reservation.`,
          `Guest: ${user.name || user.email}`,
          `Title: ${itemTitle}`,
          `Dates: ${fromDate} to ${toDate} (${nights} day${nights > 1 ? 's' : ''})`,
          `Location: ${itemLocation || 'N/A'}`,
          `Total: NPR ${Number(payload.totalPrice || 0).toFixed(2)}`,
        ].join('\n'),
      });
    }
  } catch (error) {
    console.error('Failed to send reservation emails:', error);
  }

  return booking;
};

export const listBookingsService = () => listBookingsRepo();

export const listActiveBookingsForListingService = async (listingId: string, kind: 'accommodation' | 'experience') => {
  ensureValidObjectId(listingId, 'listing id');
  const { findActiveBookingsForListingRepo } = await import('../repositories/erd.repository');
  return findActiveBookingsForListingRepo(listingId, kind);
};

export const listBookingsByUserService = (userId: string) => {
  ensureValidObjectId(userId, 'user id');
  return listBookingsByUserRepo(userId);
};

export const getBookingByIdService = async (id: string) => {
  ensureValidObjectId(id, 'booking id');
  const booking = await findBookingByIdRepo(id);
  if (!booking) {
    throw new ApiError('Booking not found', 404);
  }
  return booking;
};

export const updateBookingService = async (id: string, payload: Record<string, unknown>) => {
  ensureValidObjectId(id, 'booking id');

  if (payload.accommodationId || payload.experienceId) {
    const accommodationId = typeof payload.accommodationId === 'string' ? payload.accommodationId : undefined;
    const experienceId = typeof payload.experienceId === 'string' ? payload.experienceId : undefined;
    ensureEntityTarget(accommodationId, experienceId);
  }

  const updated = await updateBookingRepo(id, payload);
  if (!updated) {
    throw new ApiError('Booking not found', 404);
  }
  return updated;
};

export const deleteBookingService = async (id: string) => {
  ensureValidObjectId(id, 'booking id');
  const deleted = await deleteBookingRepo(id);
  if (!deleted) {
    throw new ApiError('Booking not found', 404);
  }
  return { message: 'Booking deleted successfully' };
};

export const createPaymentService = async (payload: {
  bookingId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paymentStatus?: 'pending' | 'successful' | 'failed' | 'refunded';
}) => {
  ensureValidObjectId(payload.bookingId, 'bookingId');

  const booking = await findBookingByIdRepo(payload.bookingId);
  if (!booking) {
    throw new ApiError('Booking not found', 404);
  }

  const existing = await findPaymentByTransactionIdRepo(payload.transactionId);
  if (existing) {
    throw new ApiError('Transaction ID already exists', 409);
  }

  return createPaymentRepo(payload);
};

export const listPaymentsService = () => listPaymentsRepo();

export const getPaymentByIdService = async (id: string) => {
  ensureValidObjectId(id, 'payment id');
  const payment = await findPaymentByIdRepo(id);
  if (!payment) {
    throw new ApiError('Payment not found', 404);
  }
  return payment;
};

export const updatePaymentService = async (id: string, payload: Record<string, unknown>) => {
  ensureValidObjectId(id, 'payment id');
  const updated = await updatePaymentRepo(id, payload);
  if (!updated) {
    throw new ApiError('Payment not found', 404);
  }
  return updated;
};

export const deletePaymentService = async (id: string) => {
  ensureValidObjectId(id, 'payment id');
  const deleted = await deletePaymentRepo(id);
  if (!deleted) {
    throw new ApiError('Payment not found', 404);
  }
  return { message: 'Payment deleted successfully' };
};

export const createReviewService = async (payload: {
  userId: string;
  accommodationId?: string;
  experienceId?: string;
  rating: number;
  comment?: string;
}) => {
  ensureValidObjectId(payload.userId, 'userId');
  ensureEntityTarget(payload.accommodationId, payload.experienceId);

  const user = await findUserByIdInERD(payload.userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (payload.accommodationId) {
    ensureValidObjectId(payload.accommodationId, 'accommodationId');
    const accommodation = await findAccommodationByIdRepo(payload.accommodationId);
    if (!accommodation) {
      throw new ApiError('Accommodation not found', 404);
    }
  }

  if (payload.experienceId) {
    ensureValidObjectId(payload.experienceId, 'experienceId');
    const experience = await findExperienceByIdRepo(payload.experienceId);
    if (!experience) {
      throw new ApiError('Experience not found', 404);
    }
  }

  if (payload.rating < 1 || payload.rating > 5) {
    throw new ApiError('Rating must be between 1 and 5', 400);
  }

  return createReviewRepo(payload);
};

export const listReviewsService = () => listReviewsRepo();

export const getReviewByIdService = async (id: string) => {
  ensureValidObjectId(id, 'review id');
  const review = await findReviewByIdRepo(id);
  if (!review) {
    throw new ApiError('Review not found', 404);
  }
  return review;
};

export const updateReviewService = async (id: string, payload: Record<string, unknown>) => {
  ensureValidObjectId(id, 'review id');

  if (typeof payload.rating === 'number' && (payload.rating < 1 || payload.rating > 5)) {
    throw new ApiError('Rating must be between 1 and 5', 400);
  }

  const updated = await updateReviewRepo(id, payload);
  if (!updated) {
    throw new ApiError('Review not found', 404);
  }
  return updated;
};

export const deleteReviewService = async (id: string) => {
  ensureValidObjectId(id, 'review id');
  const deleted = await deleteReviewRepo(id);
  if (!deleted) {
    throw new ApiError('Review not found', 404);
  }
  return { message: 'Review deleted successfully' };
};

export const createAdminProfileService = async (payload: { userId: string; assignedSince?: string }) => {
  ensureValidObjectId(payload.userId, 'userId');

  const user = await findUserByIdInERD(payload.userId);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const existing = await findAdminProfileByUserIdRepo(payload.userId);
  if (existing) {
    throw new ApiError('Admin profile already exists for this user', 409);
  }

  const assignedSince = payload.assignedSince ? new Date(payload.assignedSince) : undefined;
  if (payload.assignedSince && assignedSince && Number.isNaN(assignedSince.getTime())) {
    throw new ApiError('Invalid assignedSince date', 400);
  }

  return createAdminProfileRepo({
    userId: payload.userId,
    ...(assignedSince ? { assignedSince } : {}),
  });
};

export const listAdminProfilesService = () => listAdminProfilesRepo();

export const getAdminProfileByIdService = async (id: string) => {
  ensureValidObjectId(id, 'admin profile id');
  const adminProfile = await findAdminProfileByIdRepo(id);
  if (!adminProfile) {
    throw new ApiError('Admin profile not found', 404);
  }
  return adminProfile;
};

export const updateAdminProfileService = async (id: string, payload: Record<string, unknown>) => {
  ensureValidObjectId(id, 'admin profile id');
  const updated = await updateAdminProfileRepo(id, payload);
  if (!updated) {
    throw new ApiError('Admin profile not found', 404);
  }
  return updated;
};

export const deleteAdminProfileService = async (id: string) => {
  ensureValidObjectId(id, 'admin profile id');
  const deleted = await deleteAdminProfileRepo(id);
  if (!deleted) {
    throw new ApiError('Admin profile not found', 404);
  }
  return { message: 'Admin profile deleted successfully' };
};
