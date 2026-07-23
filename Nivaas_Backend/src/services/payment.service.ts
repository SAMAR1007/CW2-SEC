import crypto from 'crypto';
import { ApiError } from '../exceptions/api.error';
import { BookingModel } from '../models/booking.model';
import { AccommodationModel } from '../models/accommodation.model';
import { ExperienceModel } from '../models/experience.model';
import { HostProfileModel } from '../models/hostProfile.model';
import { UserModel } from '../models/user.model';
import { sendEmail } from '../utils/email.util';
import { createNotificationService } from './notification.service';
import {
  createBookingRepo,
  createPaymentRepo,
  cancelPendingBookingRepo,
  cancelStalePendingBookingsRepo,
  findAccommodationByIdRepo,
  findBookingByIdRepo,
  findExperienceByIdRepo,
  findHostProfileByIdRepo,
  findOverlappingAccommodationBookingRepo,
  findOverlappingExperienceBookingRepo,
  findPaymentByBookingIdRepo,
  findPaymentByTransactionIdRepo,
  updateBookingRepo,
  updatePaymentRepo,
} from '../repositories/erd.repository';

const ESEWA_FORM_URL =
  process.env.ESEWA_FORM_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
// Temporary hardcode to test - the .env parsing has issues with special characters
const ESEWA_SECRET_KEY = '8gBm/:&EnhH.1/q';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

type EsewaDecodedPayload = {
  status?: string;
  total_amount?: string;
  transaction_uuid?: string;
  product_code?: string;
  signature?: string;
};

const normalizeId = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && '_id' in (value as Record<string, unknown>)) {
    const nested = (value as { _id?: unknown })._id;
    return nested ? String(nested) : undefined;
  }
  try {
    return String(value);
  } catch {
    return undefined;
  }
};

const formatAmount = (amount: number) => {
  // eSewa expects exactly 2 decimal places, no trailing zeros removed
  return amount.toFixed(2);
};

const buildSignature = (totalAmount: string, transactionUuid: string, productCode: string) => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  console.log('🔐 eSewa Signature Debug:');
  console.log('  Secret Key:', ESEWA_SECRET_KEY);
  console.log('  Message:', message);
  console.log('  Total Amount:', totalAmount);
  console.log('  Transaction UUID:', transactionUuid);
  console.log('  Product Code:', productCode);
  
  const signature = crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(message).digest('base64');
  console.log('  Generated Signature:', signature);
  
  return signature;
};

const toFrontendReservationUrl = (
  reservationStatus: 'success' | 'failed' = 'failed',
  accommodationId?: string,
  experienceId?: string,
  options?: {
    paidAmount?: string;
  },
) => {
  const query = new URLSearchParams({ reservation: reservationStatus });
  if (reservationStatus === 'success' && options?.paidAmount) {
    query.set('paid', options.paidAmount);
    query.set('payment', 'esewa');
  }

  if (accommodationId) {
    return `${FRONTEND_BASE_URL}/stays/${accommodationId}?${query.toString()}`;
  }
  if (experienceId) {
    return `${FRONTEND_BASE_URL}/experiences/${experienceId}?${query.toString()}`;
  }
  if (!accommodationId && !experienceId) {
    return `${FRONTEND_BASE_URL}/?${query.toString()}`;
  }
  return `${FRONTEND_BASE_URL}/?${query.toString()}`;
};

const decodeEsewaData = (encodedData?: string): EsewaDecodedPayload | null => {
  if (!encodedData) return null;

  try {
    const decoded = Buffer.from(encodedData, 'base64').toString('utf-8');
    return JSON.parse(decoded) as EsewaDecodedPayload;
  } catch {
    return null;
  }
};

const toDisplayDate = (value: Date) =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const toNightsCount = (startDate: Date, endDate: Date) => {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const sendBookingSuccessEmailAndNotifications = async (bookingId: string) => {
  try {
    const booking = await BookingModel.findById(bookingId).lean();
    if (!booking) return;

    const traveler = await UserModel.findById(booking.userId).lean();
    if (!traveler?.email) return;

    const nights = toNightsCount(booking.startDate, booking.endDate);
    const fromDate = toDisplayDate(booking.startDate);
    const toDate = toDisplayDate(booking.endDate);

    let itemTypeLabel = 'Booking';
    let itemTitle = 'Your reservation';
    let itemLocation = '';
    let hostName = 'Host';
    let hostPhone = '';
    let hostEmail = '';
    let hostUserId = '';

    if (booking.accommodationId) {
      const accommodationId = normalizeId(booking.accommodationId);
      const accommodation = accommodationId ? await AccommodationModel.findById(accommodationId).lean() : null;
      if (accommodation) {
        itemTypeLabel = 'Stay';
        itemTitle = accommodation.title;
        itemLocation = accommodation.location || '';

        const hostProfileId = normalizeId(accommodation.hostId);
        const hostProfile = hostProfileId ? await HostProfileModel.findById(hostProfileId).lean() : null;
        if (hostProfile) {
          hostPhone = hostProfile.phoneNumber || '';
          const hostUserIdValue = normalizeId(hostProfile.userId);
          const hostUser = hostUserIdValue ? await UserModel.findById(hostUserIdValue).lean() : null;
          if (hostUser) {
            hostName = hostUser.name || hostName;
            hostEmail = hostUser.email || '';
            hostUserId = String(hostUser._id);
          }
        }
      }
    }

    if (booking.experienceId) {
      const experienceId = normalizeId(booking.experienceId);
      const experience = experienceId ? await ExperienceModel.findById(experienceId).lean() : null;
      if (experience) {
        itemTypeLabel = 'Experience';
        itemTitle = experience.title;
        itemLocation = experience.location || '';

        const hostProfileId = normalizeId(experience.hostId);
        const hostProfile = hostProfileId ? await HostProfileModel.findById(hostProfileId).lean() : null;
        if (hostProfile) {
          hostPhone = hostProfile.phoneNumber || '';
          const hostUserIdValue = normalizeId(hostProfile.userId);
          const hostUser = hostUserIdValue ? await UserModel.findById(hostUserIdValue).lean() : null;
          if (hostUser) {
            hostName = hostUser.name || hostName;
            hostEmail = hostUser.email || '';
            hostUserId = String(hostUser._id);
          }
        }
      }
    }

    const mapUrl = itemLocation
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(itemLocation)}`
      : '';

    const subject = `homecomf ${itemTypeLabel} Booking Confirmed`;
    const text = [
      `Hi ${traveler.name || 'Traveler'},`,
      '',
      `Your ${itemTypeLabel.toLowerCase()} booking is confirmed.`,
      `Title: ${itemTitle}`,
      `Dates: ${fromDate} to ${toDate} (${nights} day${nights > 1 ? 's' : ''})`,
      `Location: ${itemLocation || 'N/A'}`,
      mapUrl ? `Map: ${mapUrl}` : '',
      `Host: ${hostName}`,
      hostPhone ? `Host phone: ${hostPhone}` : '',
      hostEmail ? `Host email: ${hostEmail}` : '',
      `Total paid: NPR ${Number(booking.totalPrice || 0).toFixed(2)}`,
      '',
      'Thank you for booking with homecomf.',
    ]
      .filter(Boolean)
      .join('\n');

    const html = `
      <div style="background:#f9fafb;padding:24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #f1f5f9;overflow:hidden;">
          <div style="background:#FF5A1F;padding:20px 24px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:0.3px;">homecomf Booking Confirmation</h1>
          </div>
          <div style="padding:24px;color:#0f172a;line-height:1.5;">
            <p style="margin:0 0 12px;">Hi ${traveler.name || 'Traveler'},</p>
            <p style="margin:0 0 12px;">Your ${itemTypeLabel.toLowerCase()} booking is confirmed.</p>
            <p style="margin:0 0 8px;"><strong>Title:</strong> ${itemTitle}</p>
            <p style="margin:0 0 8px;"><strong>Dates:</strong> ${fromDate} to ${toDate} (${nights} day${nights > 1 ? 's' : ''})</p>
            <p style="margin:0 0 8px;"><strong>Location:</strong> ${itemLocation || 'N/A'}</p>
            ${mapUrl ? `<p style="margin:0 0 8px;"><a href="${mapUrl}" target="_blank" rel="noreferrer" style="color:#ea580c;text-decoration:underline;">View location on map</a></p>` : ''}
            <p style="margin:0 0 8px;"><strong>Host:</strong> ${hostName}</p>
            ${hostPhone ? `<p style="margin:0 0 8px;"><strong>Host phone:</strong> ${hostPhone}</p>` : ''}
            ${hostEmail ? `<p style="margin:0 0 8px;"><strong>Host email:</strong> ${hostEmail}</p>` : ''}
            <p style="margin:0 0 8px;"><strong>Total paid:</strong> NPR ${Number(booking.totalPrice || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: traveler.email,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
    }

    if (hostEmail) {
      const hostSubject = `homecomf: New ${itemTypeLabel} booking received`;
      const hostText = [
        `Hi ${hostName || 'Host'},`,
        '',
        `You received a new ${itemTypeLabel.toLowerCase()} booking.`,
        `Guest: ${traveler.name || traveler.email}`,
        `Title: ${itemTitle}`,
        `Dates: ${fromDate} to ${toDate} (${nights} day${nights > 1 ? 's' : ''})`,
        `Location: ${itemLocation || 'N/A'}`,
        `Total paid by guest: NPR ${Number(booking.totalPrice || 0).toFixed(2)}`,
      ].join('\n');

      const hostHtml = `
        <div style="background:#f9fafb;padding:24px;font-family:Arial,Helvetica,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #f1f5f9;overflow:hidden;">
            <div style="background:#0f172a;padding:20px 24px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:0.3px;">New Booking Received</h1>
            </div>
            <div style="padding:24px;color:#0f172a;line-height:1.5;">
              <p style="margin:0 0 12px;">Hi ${hostName || 'Host'},</p>
              <p style="margin:0 0 12px;">You received a new ${itemTypeLabel.toLowerCase()} booking.</p>
              <p style="margin:0 0 8px;"><strong>Guest:</strong> ${traveler.name || traveler.email}</p>
              <p style="margin:0 0 8px;"><strong>Title:</strong> ${itemTitle}</p>
              <p style="margin:0 0 8px;"><strong>Dates:</strong> ${fromDate} to ${toDate} (${nights} day${nights > 1 ? 's' : ''})</p>
              <p style="margin:0 0 8px;"><strong>Location:</strong> ${itemLocation || 'N/A'}</p>
              <p style="margin:0;"><strong>Total paid by guest:</strong> NPR ${Number(booking.totalPrice || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: hostEmail,
          subject: hostSubject,
          text: hostText,
          html: hostHtml,
        });
      } catch (error) {
        console.error('Failed to send host booking email:', error);
      }
    }

    await createNotificationService({
      userId: String(traveler._id),
      type: 'booking_confirmed',
      title: `${itemTypeLabel} booked successfully`,
      message: `${itemTitle} from ${fromDate} to ${toDate}`,
      targetPage: 'trips',
      metadata: {
        bookingId: String(booking._id),
        accommodationId: booking.accommodationId ? String(booking.accommodationId) : undefined,
        experienceId: booking.experienceId ? String(booking.experienceId) : undefined,
      },
    });

    if (hostUserId) {
      await createNotificationService({
        userId: hostUserId,
        type: 'host_booking_received',
        title: `New ${itemTypeLabel.toLowerCase()} reservation`,
        message: `${traveler.name || 'A traveler'} booked ${itemTitle}`,
        targetPage: 'hostDashboard',
        metadata: {
          bookingId: String(booking._id),
          travelerId: String(traveler._id),
          accommodationId: booking.accommodationId ? String(booking.accommodationId) : undefined,
          experienceId: booking.experienceId ? String(booking.experienceId) : undefined,
        },
      });
    }
  } catch (error) {
    console.error('Failed to send booking success notifications/email:', error);
  }
};

export const initiateEsewaPaymentService = async (payload: {
  userId: string;
  accommodationId?: string;
  experienceId?: string;
  startDate: string;
  endDate: string;
}) => {
  const { userId, accommodationId, experienceId, startDate, endDate } = payload;

  console.log('💳 [Payment Service] Starting eSewa payment initiation', {
    userId,
    accommodationId,
    experienceId,
    startDate,
    endDate,
  });

  if ((!accommodationId && !experienceId) || (accommodationId && experienceId)) {
    throw new ApiError('Provide exactly one of accommodationId or experienceId', 400);
  }

  // Clean up any stale pending bookings before checking availability
  await cleanupStalePendingBookings();

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError('Invalid check-in/check-out dates', 400);
  }

  const diffMs = end.getTime() - start.getTime();
  const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    throw new ApiError('Check-out date must be after check-in date', 400);
  }

  let totalAmountNumber = 0;

  if (accommodationId) {
    console.log('🏠 [Payment Service] Processing accommodation booking');
    const accommodation = await findAccommodationByIdRepo(accommodationId);
    if (!accommodation) {
      throw new ApiError('Accommodation not found', 404);
    }

    const hostProfile = await findHostProfileByIdRepo(accommodation.hostId.toString());
    const hostUserId = hostProfile?.userId ? hostProfile.userId.toString() : '';
    if (hostUserId && hostUserId === userId) {
      throw new ApiError('Hosts cannot book their own stays', 403);
    }

    const overlapping = await findOverlappingAccommodationBookingRepo(accommodationId, start, end);
    if (overlapping) {
      throw new ApiError('Selected dates are not available for this stay', 409);
    }

    totalAmountNumber = Number((accommodation.price * nights).toFixed(2));
  }

  if (experienceId) {
    console.log('🎯 [Payment Service] Processing experience booking');
    const experience = await findExperienceByIdRepo(experienceId);
    if (!experience) {
      throw new ApiError('Experience not found', 404);
    }

    console.log('✅ Experience found:', { id: experienceId, title: experience.title, hostId: experience.hostId });

    const hostProfile = await findHostProfileByIdRepo(experience.hostId.toString());
    console.log('✅ Host profile found:', { hostId: experience.hostId, profileExists: !!hostProfile });

    const hostUserId = hostProfile?.userId ? hostProfile.userId.toString() : '';
    if (hostUserId && hostUserId === userId) {
      throw new ApiError('Hosts cannot book their own experiences', 403);
    }

    const overlapping = await findOverlappingExperienceBookingRepo(experienceId, start, end);
    if (overlapping) {
      throw new ApiError('Selected dates are not available for this experience', 409);
    }

    totalAmountNumber = Number((experience.price * nights).toFixed(2));
  }

  console.log('✅ Validation passed, creating booking...');

  const booking = await createBookingRepo({
    userId,
    ...(accommodationId ? { accommodationId } : {}),
    ...(experienceId ? { experienceId } : {}),
    startDate: start,
    endDate: end,
    totalPrice: totalAmountNumber,
    status: 'pending',
  });

  console.log('✅ Booking created:', { bookingId: booking._id, totalAmount: totalAmountNumber });

  const transactionUuid = `${booking._id.toString()}-${Date.now()}`;

  await createPaymentRepo({
    bookingId: booking._id.toString(),
    amount: totalAmountNumber,
    paymentMethod: 'esewa',
    transactionId: transactionUuid,
    paymentStatus: 'pending',
  });

  console.log('✅ Payment record created:', { transactionUuid });

  const totalAmount = formatAmount(totalAmountNumber);
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const signature = buildSignature(totalAmount, transactionUuid, ESEWA_PRODUCT_CODE);

  const formFields = {
    amount: totalAmount,
    tax_amount: '0',
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: ESEWA_PRODUCT_CODE,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: `${BACKEND_BASE_URL}/api/payment/esewa/success`,
    failure_url: `${BACKEND_BASE_URL}/api/payment/esewa/failure?transaction_uuid=${transactionUuid}`,
    signed_field_names: signedFieldNames,
    signature,
  };

  console.log('✅ Payment service completed successfully');

  return {
    paymentUrl: ESEWA_FORM_URL,
    formFields,
    bookingId: booking._id.toString(),
  };
};

export const handleEsewaSuccessService = async (encodedData?: string) => {
  const decodedData = decodeEsewaData(encodedData);
  const callbackStatus = String(decodedData?.status || '').toUpperCase();
  const allowTestCallbackFallback =
    process.env.ALLOW_ESEWA_INSECURE_CALLBACK === 'true' || ESEWA_PRODUCT_CODE === 'EPAYTEST';

  if (!decodedData?.transaction_uuid) {
    return {
      redirectUrl: toFrontendReservationUrl('failed'),
    };
  }

  const payment = await findPaymentByTransactionIdRepo(decodedData.transaction_uuid);
  if (!payment) {
    return {
      redirectUrl: toFrontendReservationUrl('failed'),
    };
  }

  const booking = await findBookingByIdRepo(String(payment.bookingId));
  const accommodationId = normalizeId(booking?.accommodationId);
  const experienceId = normalizeId(booking?.experienceId);

  let isSignatureValid = false;
  if (decodedData.total_amount && decodedData.product_code && decodedData.signature) {
    const expectedSignature = buildSignature(
      decodedData.total_amount,
      decodedData.transaction_uuid,
      decodedData.product_code,
    );
    isSignatureValid = decodedData.signature === expectedSignature;

    if (!isSignatureValid) {
      console.error('eSewa signature mismatch', {
        transaction_uuid: decodedData.transaction_uuid,
        decodedSignature: decodedData.signature,
        expectedSignature,
        status: callbackStatus,
      });
    }
  }

  const canTrustStatusFallback = callbackStatus === 'COMPLETE' && allowTestCallbackFallback;
  if (!isSignatureValid && !canTrustStatusFallback) {
    return {
      redirectUrl: toFrontendReservationUrl('failed', accommodationId, experienceId),
    };
  }

  if (!isSignatureValid && canTrustStatusFallback) {
    console.warn('Proceeding with eSewa callback using COMPLETE status fallback in test mode', {
      transaction_uuid: decodedData.transaction_uuid,
      status: callbackStatus,
      productCode: ESEWA_PRODUCT_CODE,
    });
  }

  if (payment.paymentStatus !== 'successful') {
    await updatePaymentRepo(payment._id.toString(), {
      paymentStatus: 'successful',
      paymentMethod: 'esewa',
    });

    await updateBookingRepo(payment.bookingId.toString(), {
      status: 'confirmed',
    });

    await sendBookingSuccessEmailAndNotifications(payment.bookingId.toString());
  }

  return {
    redirectUrl: toFrontendReservationUrl('success', accommodationId, experienceId, {
      paidAmount: decodedData.total_amount || formatAmount(Number(payment.amount || 0)),
    }),
  };
};

export const handleEsewaFailureService = async (transactionUuid?: string) => {
  let accommodationId: string | undefined;
  let experienceId: string | undefined;

  if (transactionUuid) {
    const payment = await findPaymentByTransactionIdRepo(transactionUuid);
    if (payment) {
      const booking = await findBookingByIdRepo(payment.bookingId.toString());
      accommodationId = normalizeId(booking?.accommodationId);
      experienceId = normalizeId(booking?.experienceId);

      if (payment.paymentStatus === 'successful') {
        return {
          redirectUrl: toFrontendReservationUrl('success', accommodationId, experienceId, {
            paidAmount: formatAmount(Number(payment.amount || 0)),
          }),
        };
      }

      await updatePaymentRepo(payment._id.toString(), {
        paymentStatus: 'failed',
        paymentMethod: 'esewa',
      });

      await updateBookingRepo(payment.bookingId.toString(), {
        status: 'cancelled',
      });
    }
  }

  return {
    redirectUrl: toFrontendReservationUrl('failed', accommodationId, experienceId),
  };
};

/**
 * Cancel a pending booking explicitly (called when the user closes the
 * payment screen without completing payment).
 */
export const cancelPendingBookingService = async (bookingId: string, userId: string) => {
  const cancelled = await cancelPendingBookingRepo(bookingId, userId);
  if (!cancelled) {
    // Either already confirmed/cancelled or doesn't belong to this user — no-op
    return { cancelled: false };
  }

  // Also mark the associated payment as failed
  const payment = await findPaymentByBookingIdRepo(bookingId);
  if (payment && payment.paymentStatus !== 'successful') {
    await updatePaymentRepo(payment._id.toString(), { paymentStatus: 'failed' });
  }

  console.log(`🗑️ Pending booking ${bookingId} cancelled by user ${userId}`);
  return { cancelled: true };
};

/**
 * Periodic cleanup: cancel stale pending bookings older than 15 minutes.
 * Called on every payment initiation and on server start-up interval.
 */
export const cleanupStalePendingBookings = async () => {
  try {
    const count = await cancelStalePendingBookingsRepo();
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} stale pending booking(s)`);
    }
  } catch (error) {
    console.error('Failed to cleanup stale pending bookings:', error);
  }
};
