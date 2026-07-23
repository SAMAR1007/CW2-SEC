import {
  findHostProfileByUserId,
  createHostProfile,
  updateHostProfileByUserId,
} from '../repositories/hostProfile.repository';
import {
  createAccommodationRepo,
  createExperienceRepo,
  findAccommodationsByHostIdRepo,
  findAccommodationByIdRepo,
  findExperienceByIdRepo,
  findExperiencesByHostIdRepo,
  updateAccommodationRepo,
  updateExperienceRepo,
  listBookingsRepo,
} from '../repositories/erd.repository';
import { ApiError } from '../exceptions/api.error';
import { Types } from 'mongoose';

export const applyAsHost = async (
  userId: string,
  payload: {
    legalName: string;
    phoneNumber: string;
    address: string;
    governmentId?: string;
    idDocumentPath?: string;
  }
) => {
  if (!payload.legalName?.trim() || !payload.phoneNumber?.trim() || !payload.address?.trim()) {
    throw new ApiError('Legal name, phone number, and address are required', 400);
  }

  const existing = await findHostProfileByUserId(userId);

  if (existing) {
    if (existing.verificationStatus === 'verified') {
      throw new ApiError('You are already a verified host', 400);
    }
    const updateData: any = {
      legalName: payload.legalName.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      address: payload.address.trim(),
      governmentId: payload.governmentId?.trim() || existing.governmentId,
      verificationStatus: 'pending',
      rejectionReason: '',
    };
    if (payload.idDocumentPath) updateData.idDocument = payload.idDocumentPath;
    return await updateHostProfileByUserId(userId, updateData);
  }

  return await createHostProfile({
    userId: new Types.ObjectId(userId),
    legalName: payload.legalName.trim(),
    phoneNumber: payload.phoneNumber.trim(),
    address: payload.address.trim(),
    governmentId: payload.governmentId?.trim() || '',
    idDocument: payload.idDocumentPath || '',
  });
};

export const getMyHostStatus = async (userId: string) => {
  const profile = await findHostProfileByUserId(userId);
  if (!profile) {
    return { hostProfile: null, isHost: false, status: null, rejectionReason: null };
  }
  return {
    hostProfile: profile,
    isHost: profile.verificationStatus === 'verified',
    status: profile.verificationStatus,
    rejectionReason: profile.rejectionReason || null,
  };
};

export const createListing = async (
  userId: string,
  payload: {
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
  }
) => {
  const hostProfile = await findHostProfileByUserId(userId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }
  if (hostProfile.verificationStatus !== 'verified') {
    throw new ApiError('You must be a verified host to create listings', 403);
  }

  return await createAccommodationRepo({
    hostId: hostProfile._id.toString(),
    ...payload,
  });
};

export const getMyListings = async (userId: string) => {
  const hostProfile = await findHostProfileByUserId(userId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }
  return await findAccommodationsByHostIdRepo(hostProfile._id.toString());
};

export const getMyListingById = async (userId: string, listingId: string) => {
  const hostProfile = await findHostProfileByUserId(userId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }
  
  const listing = await findAccommodationByIdRepo(listingId);
  
  if (!listing) {
    throw new ApiError('Listing not found', 404);
  }
  
  // Verify the listing belongs to this host
  if (listing.hostId.toString() !== hostProfile._id.toString()) {
    throw new ApiError('You do not have permission to access this listing', 403);
  }
  
  return listing;
};

export const updateMyListing = async (
  userId: string,
  listingId: string,
  payload: Record<string, unknown>
) => {
  const hostProfile = await findHostProfileByUserId(userId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }
  
  const listing = await findAccommodationByIdRepo(listingId);
  
  if (!listing) {
    throw new ApiError('Listing not found', 404);
  }
  
  // Verify the listing belongs to this host
  if (listing.hostId.toString() !== hostProfile._id.toString()) {
    throw new ApiError('You do not have permission to update this listing', 403);
  }
  
  return await updateAccommodationRepo(listingId, payload);
};

export const createExperience = async (
  userId: string,
  payload: {
    title: string;
    category: string;
    location: string;
    price: number;
    duration: string;
    yearsOfExperience?: number;
    maxGuests?: number;
    description?: string;
    images?: string[];
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
  }
) => {
  const hostProfile = await findHostProfileByUserId(userId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }
  if (hostProfile.verificationStatus !== 'verified') {
    throw new ApiError('You must be a verified host to create experiences', 403);
  }

  return await createExperienceRepo({
    hostId: hostProfile._id.toString(),
    ...payload,
  });
};

export const getMyExperiences = async (userId: string) => {
  const hostProfile = await findHostProfileByUserId(userId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }
  return await findExperiencesByHostIdRepo(hostProfile._id.toString());
};

export const getMyExperienceById = async (userId: string, experienceId: string) => {
  const hostProfile = await findHostProfileByUserId(userId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }

  const experience = await findExperienceByIdRepo(experienceId);
  if (!experience) {
    throw new ApiError('Experience not found', 404);
  }

  if (experience.hostId.toString() !== hostProfile._id.toString()) {
    throw new ApiError('You do not have permission to access this experience', 403);
  }

  return experience;
};

export const updateMyExperience = async (
  userId: string,
  experienceId: string,
  payload: Record<string, unknown>
) => {
  const hostProfile = await findHostProfileByUserId(userId);
  if (!hostProfile) {
    throw new ApiError('Host profile not found', 404);
  }

  const experience = await findExperienceByIdRepo(experienceId);
  if (!experience) {
    throw new ApiError('Experience not found', 404);
  }

  if (experience.hostId.toString() !== hostProfile._id.toString()) {
    throw new ApiError('You do not have permission to update this experience', 403);
  }

  return await updateExperienceRepo(experienceId, payload);
};

export const getHostReservations = async (userId: string) => {
  console.log('\n🔍 [START] Finding host profile for user:', userId);
  
  const hostProfile = await findHostProfileByUserId(userId);
  if (!hostProfile) {
    console.log('❌ No host profile found for user:', userId);
    throw new ApiError('Host profile not found', 404);
  }
  
  console.log('✅ Host profile found:', hostProfile._id.toString());

  const [listings, experiences, bookings] = await Promise.all([
    findAccommodationsByHostIdRepo(hostProfile._id.toString()),
    findExperiencesByHostIdRepo(hostProfile._id.toString()),
    listBookingsRepo(),
  ]);

  console.log('\n🏠 Host Reservations Debug:');
  console.log('  Host Profile ID:', hostProfile._id.toString());
  console.log('  Host Listings:', listings.length);
  if (listings.length > 0) {
    console.log('    Details:', listings.map(l => ({ _id: l._id.toString(), title: l.title })));
  }
  console.log('  Host Experiences:', experiences.length);
  console.log('  Total Bookings in System:', bookings.length);

  const listingIds = new Set(listings.map((item) => item._id.toString()));
  const experienceIds = new Set(experiences.map((item) => item._id.toString()));

  if (bookings.length === 0) {
    console.log('⚠️  No bookings in system at all');
    return [];
  }

  const filtered = bookings.filter((booking) => {
    // Handle populated objects - extract _id if it's an object
    let accommodationId = '';
    let experienceId = '';
    
    if (booking.accommodationId) {
      if (typeof booking.accommodationId === 'object' && '_id' in booking.accommodationId) {
        const accObj = booking.accommodationId as any;
        accommodationId = accObj._id?.toString?.() || accObj._id || '';
      } else {
        accommodationId = String(booking.accommodationId);
      }
    }
    
    if (booking.experienceId) {
      if (typeof booking.experienceId === 'object' && '_id' in booking.experienceId) {
        const expObj = booking.experienceId as any;
        experienceId = expObj._id?.toString?.() || expObj._id || '';
      } else {
        experienceId = String(booking.experienceId);
      }
    }
    
    const isMatch = listingIds.has(accommodationId) || experienceIds.has(experienceId);
    
    if (!isMatch && (accommodationId || experienceId)) {
      console.log(`  ❌ Booking ${booking._id} - accomodationId: ${accommodationId}, experienceId: ${experienceId} (not matched to host's listings)`);
    }
    
    return isMatch;
  });

  console.log(`  ✅ Filtered Reservations: ${filtered.length}/${bookings.length}`);
  if (filtered.length > 0) {
    filtered.forEach(r => {
      let accId = '';
      if (r.accommodationId) {
        if (typeof r.accommodationId === 'object' && '_id' in r.accommodationId) {
          const accObj = r.accommodationId as any;
          accId = accObj._id?.toString?.() || accObj._id || '';
        } else {
          accId = String(r.accommodationId);
        }
      }
      console.log(`    - ${r._id}: accId=${accId}, status=${r.status}, dates=${new Date(r.startDate).toLocaleDateString()}-${new Date(r.endDate).toLocaleDateString()}`);
    });
  }
  console.log('[END]\n');

  return filtered;
};
