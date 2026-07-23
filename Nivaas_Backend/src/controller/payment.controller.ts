import { Response } from 'express';
import { ApiError } from '../exceptions/api.error';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  handleEsewaFailureService,
  handleEsewaSuccessService,
  initiateEsewaPaymentService,
  cancelPendingBookingService,
} from '../services/payment.service';

export const initiateEsewaPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }

    const { accommodationId, startDate, endDate } = req.body as {
      accommodationId?: string;
      experienceId?: string;
      startDate?: string;
      endDate?: string;
    };

    const { experienceId } = req.body as {
      experienceId?: string;
    };

    if ((!accommodationId && !experienceId) || (accommodationId && experienceId) || !startDate || !endDate) {
      throw new ApiError('Provide exactly one of accommodationId or experienceId with startDate and endDate', 400);
    }

    console.log('💳 [Payment Controller] Initiating eSewa payment', {
      userId,
      accommodationId: accommodationId ? '✓' : '✗',
      experienceId: experienceId ? '✓' : '✗',
    });

    const data = await initiateEsewaPaymentService({
      userId,
      ...(accommodationId ? { accommodationId } : {}),
      ...(experienceId ? { experienceId } : {}),
      startDate,
      endDate,
    });

    console.log('💳 [Payment Controller] Payment initiated successfully');
    res.status(200).json({ message: 'eSewa payment initiated', data });
  } catch (error) {
    console.error('❌ [Payment Controller] Error:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

export const handleEsewaSuccess = async (req: AuthRequest, res: Response) => {
  try {
    const encodedData = typeof req.query.data === 'string' ? req.query.data : undefined;
    const { redirectUrl } = await handleEsewaSuccessService(encodedData);
    res.redirect(302, redirectUrl);
  } catch {
    res.redirect(302, `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}?reservation=failed`);
  }
};

export const handleEsewaFailure = async (req: AuthRequest, res: Response) => {
  try {
    const transactionUuid =
      typeof req.query.transaction_uuid === 'string'
        ? req.query.transaction_uuid
        : typeof req.query.transactionId === 'string'
          ? req.query.transactionId
          : undefined;

    const { redirectUrl } = await handleEsewaFailureService(transactionUuid);
    res.redirect(302, redirectUrl);
  } catch {
    res.redirect(302, `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}?reservation=failed`);
  }
};

export const cancelPendingBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }

    const { bookingId } = req.body as { bookingId?: string };
    if (!bookingId) {
      throw new ApiError('bookingId is required', 400);
    }

    const result = await cancelPendingBookingService(bookingId, userId);
    res.status(200).json({ message: result.cancelled ? 'Booking cancelled' : 'No pending booking found', ...result });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
