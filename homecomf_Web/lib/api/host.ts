import axios from './axios';
import { API } from './endpoints';

export const getMyHostStatus = async () => {
  const response = await axios.get(API.HOST.ME);
  return response.data;
};

export const applyAsHost = async (data: {
  legalName: string;
  phoneNumber: string;
  address: string;
  governmentId?: string;
  idDocument?: File;
}) => {
  const formData = new FormData();
  formData.append('legalName', data.legalName);
  formData.append('phoneNumber', data.phoneNumber);
  formData.append('address', data.address);
  if (data.governmentId) formData.append('governmentId', data.governmentId);
  if (data.idDocument) formData.append('idDocument', data.idDocument);

  const response = await axios.post(API.HOST.APPLY, formData);
  return response.data;
};

export const createListing = async (data: {
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
  images?: File[];
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
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
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('location', data.location);
  formData.append('price', String(data.price));
  formData.append('maxGuests', String(data.maxGuests));
  formData.append('bedrooms', String(data.bedrooms));
  formData.append('beds', String(data.beds));
  formData.append('bathrooms', String(data.bathrooms));

  if (typeof data.weekendPrice === 'number') formData.append('weekendPrice', String(data.weekendPrice));
  if (typeof data.weekendPremium === 'number') formData.append('weekendPremium', String(data.weekendPremium));
  if (data.description) formData.append('description', data.description);
  if (typeof data.isPublished === 'boolean') formData.append('isPublished', String(data.isPublished));

  if (data.highlights) formData.append('highlights', JSON.stringify(data.highlights));
  if (data.amenities) formData.append('amenities', JSON.stringify(data.amenities));
  if (data.standoutAmenities) formData.append('standoutAmenities', JSON.stringify(data.standoutAmenities));
  if (data.safetyItems) formData.append('safetyItems', JSON.stringify(data.safetyItems));
  if (data.residentialAddress) formData.append('residentialAddress', JSON.stringify(data.residentialAddress));

  if (data.images?.length) {
    data.images.forEach((file) => {
      formData.append('images', file);
    });
  }

  const response = await axios.post(API.HOST.CREATE_LISTING, formData);
  return response.data;
};

export const getMyListings = async () => {
  const response = await axios.get(API.HOST.GET_LISTINGS);
  return response.data;
};

export const getHostReservations = async () => {
  const response = await axios.get(API.HOST.GET_RESERVATIONS);
  return response.data;
};

export const getMyListingById = async (id: string) => {
  const response = await axios.get(API.HOST.GET_LISTING_BY_ID(id));
  return response.data;
};

export const deleteMyListing = async (id: string) => {
  const response = await axios.delete(`/api/erd/accommodations/${id}`);
  return response.data;
};

export const deleteMyExperience = async (id: string) => {
  const response = await axios.delete(`/api/erd/experiences/${id}`);
  return response.data;
};

export const updateMyListing = async (id: string, data: Partial<{
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
  images?: string[] | File[];  // Can be existing paths or new files
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  latitude?: number;
  longitude?: number;
  residentialAddress?: {
    country: string;
    street: string;
    apt: string;
    city: string;
    province: string;
    postalCode: string;
  };
  isPublished?: boolean;
  showExactLocation?: boolean;
}>) => {
  // If data contains File objects in images, use FormData
  const hasFiles = data.images?.some((img) => img instanceof File);
  
  if (hasFiles) {
    const formData = new FormData();
    
    // Add all non-file, non-array, non-object fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'images') return; // Handle separately
      if (value === undefined || value === null) return;
      
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    
    // Handle images
    if (data.images) {
      data.images.forEach((img) => {
        if (img instanceof File) {
          formData.append('images', img);
        } else {
          // Existing image paths - send as JSON array
          // We'll handle this separately by collecting all non-File images
        }
      });
      
      // Add existing image paths as JSON
      const existingImages = data.images.filter((img) => typeof img === 'string');
      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }
    }
    
    const response = await axios.put(API.HOST.UPDATE_LISTING(id), formData);
    return response.data;
  }
  
  // No files, use regular JSON
  const response = await axios.put(API.HOST.UPDATE_LISTING(id), data);
  return response.data;
};

export const createExperience = async (data: {
  title: string;
  category: string;
  location: string;
  price: number;
  duration: string;
  yearsOfExperience?: number;
  maxGuests?: number;
  description?: string;
  images?: File[];
  itinerary?: Array<{ title: string; description: string; duration: string }>;
  availableDates?: string[];
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
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('category', data.category);
  formData.append('location', data.location);
  formData.append('price', String(data.price));
  formData.append('duration', data.duration);

  if (typeof data.yearsOfExperience === 'number') formData.append('yearsOfExperience', String(data.yearsOfExperience));
  if (typeof data.maxGuests === 'number') formData.append('maxGuests', String(data.maxGuests));
  if (typeof data.description === 'string') formData.append('description', data.description);
  if (typeof data.isPublished === 'boolean') formData.append('isPublished', String(data.isPublished));
  if (data.residentialAddress) formData.append('residentialAddress', JSON.stringify(data.residentialAddress));

  if (data.itinerary?.length) {
    data.itinerary.forEach((item) => formData.append('itinerary', JSON.stringify(item)));
  }

  if (data.availableDates?.length) {
    data.availableDates.forEach((date) => formData.append('availableDates', date));
  }

  if (data.images?.length) {
    data.images.forEach((file) => formData.append('images', file));
  }

  const response = await axios.post(API.HOST.CREATE_EXPERIENCE, formData);
  return response.data;
};

export const getMyExperiences = async () => {
  const response = await axios.get(API.HOST.GET_EXPERIENCES);
  return response.data;
};

export const getMyExperienceById = async (id: string) => {
  const response = await axios.get(API.HOST.GET_EXPERIENCE_BY_ID(id));
  return response.data;
};

export const updateMyExperience = async (
  id: string,
  data: Partial<{
    title: string;
    category: string;
    location: string;
    price: number;
    duration: string;
    yearsOfExperience: number;
    maxGuests: number;
    description: string;
    images: Array<string | File>;
    itinerary: Array<{ title: string; description: string; duration: string }>;
    residentialAddress: {
      country: string;
      street: string;
      apt: string;
      city: string;
      province: string;
      postalCode: string;
    };
    isPublished: boolean;
  }>
) => {
  const hasFiles = data.images?.some((item) => item instanceof File);

  if (!hasFiles) {
    const response = await axios.put(API.HOST.UPDATE_EXPERIENCE(id), data);
    return response.data;
  }

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || key === 'images') return;
    if (Array.isArray(value)) {
      if (key === 'itinerary') {
        value.forEach((item) => formData.append('itinerary', JSON.stringify(item)));
      } else {
        formData.append(key, JSON.stringify(value));
      }
      return;
    }
    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, String(value));
  });

  const existingImages: string[] = [];
  (data.images || []).forEach((item) => {
    if (item instanceof File) {
      formData.append('images', item);
    } else {
      existingImages.push(item);
    }
  });
  if (existingImages.length) {
    formData.append('existingImages', JSON.stringify(existingImages));
  }

  const response = await axios.put(API.HOST.UPDATE_EXPERIENCE(id), formData);
  return response.data;
};
