import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId format');

const ensureNonEmptyUpdate = (schema: z.ZodObject<any>) =>
  schema.refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const createHostProfileDTO = z.object({
  body: z.object({
    userId: objectId,
    address: z.string().optional(),
    verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
    bio: z.string().optional(),
    idDocument: z.string().optional(),
  }),
});

export const updateHostProfileDTO = z.object({
  body: ensureNonEmptyUpdate(
    z.object({
      address: z.string().optional(),
      verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
      bio: z.string().optional(),
      idDocument: z.string().optional(),
    })
  ),
});

export const createAccommodationDTO = z.object({
  body: z.object({
    hostId: objectId,
    title: z.string().min(1),
    location: z.string().min(1),
    price: z.number().min(0),
    description: z.string().optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    maxGuests: z.number().int().min(1),
    bedrooms: z.number().int().min(1).optional(),
    beds: z.number().int().min(1).optional(),
    bathrooms: z.number().int().min(1).optional(),
  }),
});

export const updateAccommodationDTO = z.object({
  body: ensureNonEmptyUpdate(
    z.object({
      hostId: objectId.optional(),
      title: z.string().min(1).optional(),
      location: z.string().min(1).optional(),
      price: z.number().min(0).optional(),
      description: z.string().optional(),
      amenities: z.array(z.string()).optional(),
      images: z.array(z.string()).optional(),
      maxGuests: z.number().int().min(1).optional(),
      bedrooms: z.number().int().min(1).optional(),
      beds: z.number().int().min(1).optional(),
      bathrooms: z.number().int().min(1).optional(),
    })
  ),
});

export const createExperienceDTO = z.object({
  body: z.object({
    hostId: objectId,
    title: z.string().min(1),
    category: z.string().min(1),
    price: z.number().min(0),
    description: z.string().optional(),
    location: z.string().min(1),
    images: z.array(z.string()).optional(),
    duration: z.string().min(1),
    availableDates: z.array(z.string()).optional(),
  }),
});

export const updateExperienceDTO = z.object({
  body: ensureNonEmptyUpdate(
    z.object({
      hostId: objectId.optional(),
      title: z.string().min(1).optional(),
      category: z.string().min(1).optional(),
      price: z.number().min(0).optional(),
      description: z.string().optional(),
      location: z.string().min(1).optional(),
      images: z.array(z.string()).optional(),
      duration: z.string().min(1).optional(),
    })
  ),
});

export const createBookingDTO = z.object({
  body: z
    .object({
      userId: objectId.optional(),
      accommodationId: objectId.optional(),
      experienceId: objectId.optional(),
      startDate: z.string().min(1),
      endDate: z.string().min(1),
      totalPrice: z.number().min(0),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
    })
    .refine(
      (data) =>
        (data.accommodationId && !data.experienceId) ||
        (!data.accommodationId && data.experienceId),
      {
        message: 'Provide exactly one of accommodationId or experienceId',
        path: ['accommodationId'],
      }
    ),
});

export const updateBookingDTO = z.object({
  body: ensureNonEmptyUpdate(
    z
      .object({
        userId: objectId.optional(),
        accommodationId: objectId.optional(),
        experienceId: objectId.optional(),
        startDate: z.string().min(1).optional(),
        endDate: z.string().min(1).optional(),
        totalPrice: z.number().min(0).optional(),
        status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
      })
      .refine(
        (data) => !(data.accommodationId && data.experienceId),
        {
          message: 'Only one of accommodationId or experienceId can be provided',
          path: ['accommodationId'],
        }
      )
  ),
});

export const createPaymentDTO = z.object({
  body: z.object({
    bookingId: objectId,
    amount: z.number().min(0),
    paymentMethod: z.string().min(1),
    transactionId: z.string().min(1),
    paymentStatus: z.enum(['pending', 'successful', 'failed', 'refunded']).optional(),
  }),
});

export const updatePaymentDTO = z.object({
  body: ensureNonEmptyUpdate(
    z.object({
      bookingId: objectId.optional(),
      amount: z.number().min(0).optional(),
      paymentMethod: z.string().min(1).optional(),
      transactionId: z.string().min(1).optional(),
      paymentStatus: z.enum(['pending', 'successful', 'failed', 'refunded']).optional(),
    })
  ),
});

export const createReviewDTO = z.object({
  body: z
    .object({
      userId: objectId,
      accommodationId: objectId.optional(),
      experienceId: objectId.optional(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    })
    .refine(
      (data) =>
        (data.accommodationId && !data.experienceId) ||
        (!data.accommodationId && data.experienceId),
      {
        message: 'Provide exactly one of accommodationId or experienceId',
        path: ['accommodationId'],
      }
    ),
});

export const updateReviewDTO = z.object({
  body: ensureNonEmptyUpdate(
    z
      .object({
        userId: objectId.optional(),
        accommodationId: objectId.optional(),
        experienceId: objectId.optional(),
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().optional(),
      })
      .refine(
        (data) => !(data.accommodationId && data.experienceId),
        {
          message: 'Only one of accommodationId or experienceId can be provided',
          path: ['accommodationId'],
        }
      )
  ),
});

export const createAdminProfileDTO = z.object({
  body: z.object({
    userId: objectId,
    assignedSince: z.string().optional(),
  }),
});

export const updateAdminProfileDTO = z.object({
  body: ensureNonEmptyUpdate(
    z.object({
      userId: objectId.optional(),
      assignedSince: z.string().optional(),
    })
  ),
});
