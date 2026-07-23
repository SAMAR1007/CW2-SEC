import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { 
  applyAsHost, 
  getMyHostStatus, 
  createListing, 
  getMyListings,
  getMyListingById,
  updateMyListing,
  createExperience,
  getMyExperiences,
  getMyExperienceById,
  updateMyExperience,
  getHostReservations,
} from '../services/host.service';
import { ApiError } from '../exceptions/api.error';

/** Centralised error response helper used by all host controller handlers. */
const handleControllerError = (error: unknown, res: Response) => {
  console.error('❌ [Host Controller] Error:', error);

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  // Mongoose validation errors → 400 with per-field details
  if (error instanceof mongoose.Error.ValidationError) {
    const fields = Object.entries(error.errors).map(([field, err]) => ({
      field,
      message: err.message,
    }));
    res.status(400).json({
      message: `Validation failed: ${fields.map((f) => f.message).join(', ')}`,
      errors: fields,
    });
    return;
  }

  // Mongoose cast errors (e.g. invalid ObjectId)
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid value for ${error.path}: ${error.value}` });
    return;
  }

  const errMsg = error instanceof Error ? error.message : 'Unknown error';
  res.status(500).json({ message: `Internal server error: ${errMsg}` });
};

const parseArrayField = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === 'string') {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return undefined;
};

const parseItineraryField = (value: unknown) => {
  if (!value) return undefined;

  const normalizeItem = (item: unknown) => {
    if (item && typeof item === 'object') {
      return {
        title: String((item as Record<string, unknown>).title ?? ''),
        description: String((item as Record<string, unknown>).description ?? ''),
        duration: String((item as Record<string, unknown>).duration ?? ''),
      };
    }
    if (typeof item === 'string') {
      try {
        const parsed = JSON.parse(item);
        if (parsed && typeof parsed === 'object') {
          return {
            title: String((parsed as Record<string, unknown>).title ?? ''),
            description: String((parsed as Record<string, unknown>).description ?? ''),
            duration: String((parsed as Record<string, unknown>).duration ?? ''),
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  };

  if (Array.isArray(value)) {
    return value.map(normalizeItem).filter((item): item is { title: string; description: string; duration: string } => item !== null);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeItem)
          .filter((item): item is { title: string; description: string; duration: string } => item !== null);
      }
      const single = normalizeItem(parsed);
      return single ? [single] : undefined;
    } catch {
      const single = normalizeItem(value);
      return single ? [single] : undefined;
    }
  }

  return undefined;
};

const parseObjectField = (value: unknown): Record<string, unknown> | undefined => {
  if (!value) return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const parseNumberField = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const parseBooleanField = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return undefined;
};

const normalizeListingPayload = (
  rawBody: Record<string, unknown>,
  files?: Array<{ filename: string }>,
): Record<string, unknown> => {
  const uploadedImages = (files || []).map((file) => `/uploads/listings/${file.filename}`);
  const parsedImages = parseArrayField(rawBody.images);
  const existingImages = parseArrayField(rawBody.existingImages);
  
  // Merge existing images with newly uploaded images
  const finalImages = [...(existingImages || []), ...uploadedImages];
  // If no new uploads and no existing images preserved, fall back to parsed images
  const images = finalImages.length > 0 ? finalImages : parsedImages;

  return {
    ...rawBody,
    price: parseNumberField(rawBody.price),
    weekendPrice: parseNumberField(rawBody.weekendPrice),
    weekendPremium: parseNumberField(rawBody.weekendPremium),
    maxGuests: parseNumberField(rawBody.maxGuests),
    bedrooms: parseNumberField(rawBody.bedrooms),
    beds: parseNumberField(rawBody.beds),
    bathrooms: parseNumberField(rawBody.bathrooms),
    latitude: parseNumberField(rawBody.latitude),
    longitude: parseNumberField(rawBody.longitude),
    isPublished: parseBooleanField(rawBody.isPublished),
    showExactLocation: parseBooleanField(rawBody.showExactLocation),
    highlights: parseArrayField(rawBody.highlights),
    amenities: parseArrayField(rawBody.amenities),
    standoutAmenities: parseArrayField(rawBody.standoutAmenities),
    safetyItems: parseArrayField(rawBody.safetyItems),
    residentialAddress: parseObjectField(rawBody.residentialAddress),
    images,
  };
};

const normalizeExperiencePayload = (
  rawBody: Record<string, unknown>,
  files?: Array<{ filename: string }>,
): Record<string, unknown> => {
  const uploadedImages = (files || []).map((file) => `/uploads/listings/${file.filename}`);
  const existingImages = parseArrayField(rawBody.existingImages);
  const parsedImages = parseArrayField(rawBody.images);
  const itineraryRaw = parseItineraryField(rawBody.itinerary);
  const availableDatesRaw = parseArrayField(rawBody.availableDates);
  const itinerary = itineraryRaw?.length ? itineraryRaw : undefined;
  const availableDates = availableDatesRaw
    ? availableDatesRaw
        .map((item) => new Date(item))
        .filter((date) => !Number.isNaN(date.getTime()))
    : undefined;

  const finalImages = [...(existingImages || []), ...uploadedImages];

  return {
    ...rawBody,
    price: parseNumberField(rawBody.price),
    yearsOfExperience: parseNumberField(rawBody.yearsOfExperience),
    maxGuests: parseNumberField(rawBody.maxGuests),
    isPublished: parseBooleanField(rawBody.isPublished),
    images: finalImages.length > 0 ? finalImages : parsedImages,
    itinerary,
    availableDates,
    residentialAddress: parseObjectField(rawBody.residentialAddress),
  };
};

export const apply = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    const payload: {
      legalName: string;
      phoneNumber: string;
      address: string;
      governmentId?: string;
      idDocumentPath?: string;
    } = {
      legalName: req.body.legalName,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
    };
    if (req.body.governmentId) {
      payload.governmentId = req.body.governmentId;
    }
    if (req.file) {
      payload.idDocumentPath = `/uploads/hosts/${req.file.filename}`;
    }
    const hostProfile = await applyAsHost(userId, payload);
    res.status(200).json({
      message: 'Host application submitted. Pending admin verification.',
      hostProfile,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    const result = await getMyHostStatus(userId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const createListingController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    
    console.log('📸 Image Upload Debug:');
    console.log('  req.files:', (req as any).files);
    console.log('  req.file:', (req as any).file);
    console.log('  req.body:', req.body);
    
    const files = Array.isArray((req as any).files) ? ((req as any).files as Array<{ filename: string }>) : [];
    console.log('  Parsed files count:', files.length);
    
    const payload = normalizeListingPayload(req.body as Record<string, unknown>, files);

    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const location = typeof payload.location === 'string' ? payload.location.trim() : '';
    const price = typeof payload.price === 'number' ? payload.price : undefined;
    const maxGuests = typeof payload.maxGuests === 'number' ? payload.maxGuests : undefined;
    const bedrooms = typeof payload.bedrooms === 'number' ? payload.bedrooms : undefined;
    const beds = typeof payload.beds === 'number' ? payload.beds : undefined;
    const bathrooms = typeof payload.bathrooms === 'number' ? payload.bathrooms : undefined;

    if (!title || !location || price === undefined || maxGuests === undefined || bedrooms === undefined || beds === undefined || bathrooms === undefined) {
      throw new ApiError('Missing required listing fields', 400);
    }

    const listing = await createListing(userId, {
      title,
      location,
      price,
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
      ...(typeof payload.weekendPrice === 'number' ? { weekendPrice: payload.weekendPrice } : {}),
      ...(typeof payload.weekendPremium === 'number' ? { weekendPremium: payload.weekendPremium } : {}),
      ...(typeof payload.description === 'string' ? { description: payload.description } : {}),
      ...(Array.isArray(payload.highlights) ? { highlights: payload.highlights.map((item) => String(item)) } : {}),
      ...(Array.isArray(payload.amenities) ? { amenities: payload.amenities.map((item) => String(item)) } : {}),
      ...(Array.isArray(payload.standoutAmenities) ? { standoutAmenities: payload.standoutAmenities.map((item) => String(item)) } : {}),
      ...(Array.isArray(payload.safetyItems) ? { safetyItems: payload.safetyItems.map((item) => String(item)) } : {}),
      ...(Array.isArray(payload.images) ? { images: payload.images.map((item) => String(item)) } : {}),

      ...(payload.residentialAddress && typeof payload.residentialAddress === 'object'
        ? {
            residentialAddress: {
              country: String((payload.residentialAddress as Record<string, unknown>).country ?? ''),
              street: String((payload.residentialAddress as Record<string, unknown>).street ?? ''),
              apt: String((payload.residentialAddress as Record<string, unknown>).apt ?? ''),
              city: String((payload.residentialAddress as Record<string, unknown>).city ?? ''),
              province: String((payload.residentialAddress as Record<string, unknown>).province ?? ''),
              postalCode: String((payload.residentialAddress as Record<string, unknown>).postalCode ?? ''),
            },
          }
        : {}),
      ...(typeof payload.isPublished === 'boolean' ? { isPublished: payload.isPublished } : {}),
    });
    res.status(201).json({
      message: 'Listing created successfully',
      listing,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getMyListingsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    console.log('📋 Fetching listings for user:', userId);
    const listings = await getMyListings(userId);
    console.log('📋 Found listings:', listings.length);
    res.status(200).json({
      message: 'Listings fetched successfully',
      listings,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getMyListingByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    const listingId = req.params.id;
    if (!listingId) {
      throw new ApiError('Listing ID is required', 400);
    }
    const listing = await getMyListingById(userId, listingId);
    res.status(200).json({
      message: 'Listing fetched successfully',
      listing,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const updateMyListingController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    const listingId = req.params.id;
    if (!listingId) {
      throw new ApiError('Listing ID is required', 400);
    }
    const files = Array.isArray((req as any).files) ? ((req as any).files as Array<{ filename: string }>) : [];
    const payload = normalizeListingPayload(req.body as Record<string, unknown>, files);
    const listing = await updateMyListing(userId, listingId, payload);
    res.status(200).json({
      message: 'Listing updated successfully',
      listing,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const createExperienceController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }

    const files = Array.isArray((req as any).files) ? ((req as any).files as Array<{ filename: string }>) : [];
    const payload = normalizeExperiencePayload(req.body as Record<string, unknown>, files);

    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const category = typeof payload.category === 'string' ? payload.category.trim() : '';
    const location = typeof payload.location === 'string' ? payload.location.trim() : '';
    const duration = typeof payload.duration === 'string' ? payload.duration.trim() : '';
    const price = typeof payload.price === 'number' ? payload.price : undefined;

    if (!title || !category || !location || !duration || price === undefined) {
      throw new ApiError('Missing required experience fields', 400);
    }

    const experience = await createExperience(userId, {
      title,
      category,
      location,
      duration,
      price,
      ...(typeof payload.yearsOfExperience === 'number' ? { yearsOfExperience: payload.yearsOfExperience } : {}),
      ...(typeof payload.maxGuests === 'number' ? { maxGuests: payload.maxGuests } : {}),
      ...(typeof payload.description === 'string' ? { description: payload.description } : {}),
      ...(Array.isArray(payload.images) ? { images: payload.images.map((item) => String(item)) } : {}),
      ...(Array.isArray(payload.itinerary)
        ? {
            itinerary: payload.itinerary.map((item) => ({
              title: String((item as Record<string, unknown>).title ?? ''),
              description: String((item as Record<string, unknown>).description ?? ''),
              duration: String((item as Record<string, unknown>).duration ?? ''),
            })),
          }
        : {}),
      ...(Array.isArray(payload.availableDates) ? { availableDates: payload.availableDates } : {}),
      ...(payload.residentialAddress && typeof payload.residentialAddress === 'object'
        ? {
            residentialAddress: {
              country: String((payload.residentialAddress as Record<string, unknown>).country ?? ''),
              street: String((payload.residentialAddress as Record<string, unknown>).street ?? ''),
              apt: String((payload.residentialAddress as Record<string, unknown>).apt ?? ''),
              city: String((payload.residentialAddress as Record<string, unknown>).city ?? ''),
              province: String((payload.residentialAddress as Record<string, unknown>).province ?? ''),
              postalCode: String((payload.residentialAddress as Record<string, unknown>).postalCode ?? ''),
            },
          }
        : {}),
      ...(typeof payload.isPublished === 'boolean' ? { isPublished: payload.isPublished } : {}),
    });

    res.status(201).json({
      message: 'Experience created successfully',
      experience,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getMyExperiencesController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    const experiences = await getMyExperiences(userId);
    res.status(200).json({ message: 'Experiences fetched successfully', experiences });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getMyExperienceByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    const experienceId = req.params.id;
    if (!experienceId) {
      throw new ApiError('Experience ID is required', 400);
    }
    const experience = await getMyExperienceById(userId, experienceId);
    res.status(200).json({ message: 'Experience fetched successfully', experience });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const updateMyExperienceController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    const experienceId = req.params.id;
    if (!experienceId) {
      throw new ApiError('Experience ID is required', 400);
    }
    const files = Array.isArray((req as any).files) ? ((req as any).files as Array<{ filename: string }>) : [];
    const payload = normalizeExperiencePayload(req.body as Record<string, unknown>, files);
    const experience = await updateMyExperience(userId, experienceId, payload);
    res.status(200).json({ message: 'Experience updated successfully', experience });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getHostReservationsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log('\n📞 [HOST RESERVATIONS] Request received:', userId);
    if (!userId) {
      throw new ApiError('Unauthorized', 401);
    }
    const reservations = await getHostReservations(userId);
    console.log('✅ [HOST RESERVATIONS] Returning', reservations.length, 'reservations');
    res.status(200).json({ message: 'Reservations fetched successfully', reservations });
  } catch (error) {
    handleControllerError(error, res);
  }
};
