import { Request, Response } from 'express';
import { ApiError } from '../exceptions/api.error';
import {
  createAccommodationService,
  createAdminProfileService,
  createBookingService,
  createExperienceService,
  createHostProfileService,
  createPaymentService,
  createReviewService,
  deleteAccommodationService,
  deleteAdminProfileService,
  deleteBookingService,
  deleteExperienceService,
  deleteHostProfileService,
  deletePaymentService,
  deleteReviewService,
  getAccommodationByIdService,
  getAdminProfileByIdService,
  getBookingByIdService,
  getExperienceByIdService,
  getHostProfileByIdService,
  getPaymentByIdService,
  getReviewByIdService,
  listAccommodationsService,
  listAdminProfilesService,
  listBookingsService,
  listBookingsByUserService,
  listExperiencesService,
  listHostProfilesService,
  listPaymentsService,
  listReviewsService,
  updateAccommodationService,
  updateAdminProfileService,
  updateBookingService,
  updateExperienceService,
  updateHostProfileService,
  updatePaymentService,
  updateReviewService,
} from '../services/erd.service';
import {
  findOverlappingAccommodationBookingRepo,
  findOverlappingExperienceBookingRepo,
} from '../repositories/erd.repository';
import { AuthRequest } from '../middlewares/auth.middleware';

const handleError = (res: Response, error: unknown) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};

export const createHostProfile = async (req: Request, res: Response) => {
  try {
    const data = await createHostProfileService(req.body);
    res.status(201).json({ message: 'Host profile created successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const listHostProfiles = async (_req: Request, res: Response) => {
  try {
    const data = await listHostProfilesService();
    res.status(200).json({ message: 'Host profiles fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getHostProfileById = async (req: Request, res: Response) => {
  try {
    const data = await getHostProfileByIdService(req.params.id as string);
    res.status(200).json({ message: 'Host profile fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateHostProfile = async (req: Request, res: Response) => {
  try {
    const data = await updateHostProfileService(req.params.id as string, req.body as Record<string, unknown>);
    res.status(200).json({ message: 'Host profile updated successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteHostProfile = async (req: Request, res: Response) => {
  try {
    const data = await deleteHostProfileService(req.params.id as string);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

export const createAccommodation = async (req: Request, res: Response) => {
  try {
    const data = await createAccommodationService(req.body);
    res.status(201).json({ message: 'Accommodation created successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const listAccommodations = async (_req: Request, res: Response) => {
  try {
    const data = await listAccommodationsService();
    res.status(200).json({ message: 'Accommodations fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getAccommodationById = async (req: Request, res: Response) => {
  try {
    const data = await getAccommodationByIdService(req.params.id as string);
    res.status(200).json({ message: 'Accommodation fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateAccommodation = async (req: Request, res: Response) => {
  try {
    const data = await updateAccommodationService(req.params.id as string, req.body as Record<string, unknown>);
    res.status(200).json({ message: 'Accommodation updated successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteAccommodation = async (req: Request, res: Response) => {
  try {
    const data = await deleteAccommodationService(req.params.id as string);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

export const createExperience = async (req: Request, res: Response) => {
  try {
    const data = await createExperienceService(req.body);
    res.status(201).json({ message: 'Experience created successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const listExperiences = async (_req: Request, res: Response) => {
  try {
    const data = await listExperiencesService();
    res.status(200).json({ message: 'Experiences fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getExperienceById = async (req: Request, res: Response) => {
  try {
    const data = await getExperienceByIdService(req.params.id as string);
    res.status(200).json({ message: 'Experience fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateExperience = async (req: Request, res: Response) => {
  try {
    const data = await updateExperienceService(req.params.id as string, req.body as Record<string, unknown>);
    res.status(200).json({ message: 'Experience updated successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteExperience = async (req: Request, res: Response) => {
  try {
    const data = await deleteExperienceService(req.params.id as string);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }

    const data = await createBookingService({
      ...req.body,
      userId,
    });
    res.status(201).json({ message: 'Booking created successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const listBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role?.toLowerCase();

    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }

    const data = role === 'admin' ? await listBookingsService() : await listBookingsByUserService(userId);
    res.status(200).json({ message: 'Bookings fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const listActiveBookingsForListing = async (req: Request, res: Response) => {
  try {
    const { listActiveBookingsForListingService } = await import('../services/erd.service');
    const listingId = req.params.id as string;
    const kind = req.query.kind === 'experience' ? 'experience' as const : 'accommodation' as const;
    const data = await listActiveBookingsForListingService(listingId, kind);
    res.status(200).json({ message: 'Active bookings fetched', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const data = await getBookingByIdService(req.params.id as string);
    res.status(200).json({ message: 'Booking fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateBooking = async (req: Request, res: Response) => {
  try {
    const data = await updateBookingService(req.params.id as string, req.body as Record<string, unknown>);
    res.status(200).json({ message: 'Booking updated successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const data = await deleteBookingService(req.params.id as string);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const data = await createPaymentService(req.body);
    res.status(201).json({ message: 'Payment created successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const listPayments = async (_req: Request, res: Response) => {
  try {
    const data = await listPaymentsService();
    res.status(200).json({ message: 'Payments fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const data = await getPaymentByIdService(req.params.id as string);
    res.status(200).json({ message: 'Payment fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const data = await updatePaymentService(req.params.id as string, req.body as Record<string, unknown>);
    res.status(200).json({ message: 'Payment updated successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const data = await deletePaymentService(req.params.id as string);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const data = await createReviewService(req.body);
    res.status(201).json({ message: 'Review created successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const listReviews = async (_req: Request, res: Response) => {
  try {
    const data = await listReviewsService();
    res.status(200).json({ message: 'Reviews fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getReviewById = async (req: Request, res: Response) => {
  try {
    const data = await getReviewByIdService(req.params.id as string);
    res.status(200).json({ message: 'Review fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const data = await updateReviewService(req.params.id as string, req.body as Record<string, unknown>);
    res.status(200).json({ message: 'Review updated successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const data = await deleteReviewService(req.params.id as string);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

export const createAdminProfile = async (req: Request, res: Response) => {
  try {
    const data = await createAdminProfileService(req.body);
    res.status(201).json({ message: 'Admin profile created successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const listAdminProfiles = async (_req: Request, res: Response) => {
  try {
    const data = await listAdminProfilesService();
    res.status(200).json({ message: 'Admin profiles fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getAdminProfileById = async (req: Request, res: Response) => {
  try {
    const data = await getAdminProfileByIdService(req.params.id as string);
    res.status(200).json({ message: 'Admin profile fetched successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateAdminProfile = async (req: Request, res: Response) => {
  try {
    const data = await updateAdminProfileService(req.params.id as string, req.body as Record<string, unknown>);
    res.status(200).json({ message: 'Admin profile updated successfully', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteAdminProfile = async (req: Request, res: Response) => {
  try {
    const data = await deleteAdminProfileService(req.params.id as string);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

export const checkAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const accommodationId = typeof req.query.accommodationId === 'string' ? req.query.accommodationId : undefined;
    const experienceId = typeof req.query.experienceId === 'string' ? req.query.experienceId : undefined;
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    if ((!accommodationId && !experienceId) || !startDate || !endDate) {
      throw new ApiError('accommodationId or experienceId, startDate, and endDate are required', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError('Invalid date format', 400);
    }

    let overlap = null;
    if (accommodationId) {
      overlap = await findOverlappingAccommodationBookingRepo(accommodationId, start, end);
    } else if (experienceId) {
      overlap = await findOverlappingExperienceBookingRepo(experienceId, start, end);
    }

    res.status(200).json({
      available: !overlap,
      message: overlap ? 'These dates are not available' : 'Dates are available',
    });
  } catch (error) {
    handleError(res, error);
  }
};
