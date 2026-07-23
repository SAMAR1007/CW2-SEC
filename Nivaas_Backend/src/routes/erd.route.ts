import { Router } from 'express';
import {
  createAccommodation,
  createAdminProfile,
  createBooking,
  createExperience,
  createHostProfile,
  createPayment,
  createReview,
  deleteAccommodation,
  deleteAdminProfile,
  deleteBooking,
  deleteExperience,
  deleteHostProfile,
  deletePayment,
  deleteReview,
  getAccommodationById,
  getAdminProfileById,
  getBookingById,
  getExperienceById,
  getHostProfileById,
  getPaymentById,
  getReviewById,
  listAccommodations,
  listAdminProfiles,
  listBookings,
  listActiveBookingsForListing,
  listExperiences,
  listHostProfiles,
  listPayments,
  listReviews,
  updateAccommodation,
  updateAdminProfile,
  updateBooking,
  updateExperience,
  updateHostProfile,
  updatePayment,
  updateReview,
  checkAvailability,
} from '../controller/erd.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/zod.middleware';
import {
  createAccommodationDTO,
  createAdminProfileDTO,
  createBookingDTO,
  createExperienceDTO,
  createHostProfileDTO,
  createPaymentDTO,
  createReviewDTO,
  updateAccommodationDTO,
  updateAdminProfileDTO,
  updateBookingDTO,
  updateExperienceDTO,
  updateHostProfileDTO,
  updatePaymentDTO,
  updateReviewDTO,
} from '../dtos/erd.dto';

const router = Router();

// PUBLIC ROUTES (no auth required)
router.get('/accommodations', listAccommodations);
router.get('/accommodations/:id', getAccommodationById);
router.get('/experiences', listExperiences);
router.get('/experiences/:id', getExperienceById);
router.get('/bookings/listing/:id', listActiveBookingsForListing);

// PROTECTED ROUTES (auth required)
router.use(authMiddleware);

router.post('/host-profiles', validate(createHostProfileDTO), createHostProfile);
router.get('/host-profiles', listHostProfiles);
router.get('/host-profiles/:id', getHostProfileById);
router.put('/host-profiles/:id', validate(updateHostProfileDTO), updateHostProfile);
router.delete('/host-profiles/:id', deleteHostProfile);

router.post('/accommodations', validate(createAccommodationDTO), createAccommodation);
router.put('/accommodations/:id', validate(updateAccommodationDTO), updateAccommodation);
router.delete('/accommodations/:id', deleteAccommodation);

router.post('/experiences', validate(createExperienceDTO), createExperience);
router.put('/experiences/:id', validate(updateExperienceDTO), updateExperience);
router.delete('/experiences/:id', deleteExperience);

router.post('/bookings', validate(createBookingDTO), createBooking);
router.get('/bookings', listBookings);
router.get('/bookings/check-availability', checkAvailability);
router.get('/bookings/:id', getBookingById);
router.put('/bookings/:id', validate(updateBookingDTO), updateBooking);
router.delete('/bookings/:id', deleteBooking);

router.post('/payments', validate(createPaymentDTO), createPayment);
router.get('/payments', listPayments);
router.get('/payments/:id', getPaymentById);
router.put('/payments/:id', validate(updatePaymentDTO), updatePayment);
router.delete('/payments/:id', deletePayment);

router.post('/reviews', validate(createReviewDTO), createReview);
router.get('/reviews', listReviews);
router.get('/reviews/:id', getReviewById);
router.put('/reviews/:id', validate(updateReviewDTO), updateReview);
router.delete('/reviews/:id', deleteReview);

router.post('/admins', validate(createAdminProfileDTO), createAdminProfile);
router.get('/admins', listAdminProfiles);
router.get('/admins/:id', getAdminProfileById);
router.put('/admins/:id', validate(updateAdminProfileDTO), updateAdminProfile);
router.delete('/admins/:id', deleteAdminProfile);

export default router;
