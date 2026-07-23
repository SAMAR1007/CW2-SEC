import axios from './axios'
import { API } from './endpoints'

export const getPublicListings = async () => {
  const response = await axios.get(API.PUBLIC.ACCOMMODATIONS)
  return response.data
}

export const getPublicExperiences = async () => {
  const response = await axios.get(API.PUBLIC.EXPERIENCES)
  return response.data
}

export const getPublicListingById = async (id: string) => {
  const response = await axios.get(`${API.PUBLIC.ACCOMMODATIONS}/${id}`)
  return response.data
}

export const getPublicExperienceById = async (id: string) => {
  const response = await axios.get(`${API.PUBLIC.EXPERIENCES}/${id}`)
  return response.data
}

export const getHostProfileById = async (id: string) => {
  const response = await axios.get(`/api/erd/host-profiles/${id}`)
  return response.data
}

export const getAccommodationReviews = async (accommodationId: string) => {
  const response = await axios.get('/api/erd/reviews')
  const allReviews = response.data.data || []
  return allReviews.filter((r: any) => 
    r.accommodationId === accommodationId || 
    r.accommodationId?._id === accommodationId
  )
}

export const getExperienceReviews = async (experienceId: string) => {
  const response = await axios.get('/api/erd/reviews')
  const allReviews = response.data.data || []
  return allReviews.filter((r: any) => 
    r.experienceId === experienceId || 
    r.experienceId?._id === experienceId
  )
}

export const createAccommodationReview = async (payload: {
  userId: string
  accommodationId: string
  rating: number
  comment?: string
}) => {
  const response = await axios.post('/api/erd/reviews', payload)
  return response.data
}

export const createExperienceReview = async (payload: {
  userId: string
  experienceId: string
  rating: number
  comment?: string
}) => {
  const response = await axios.post('/api/erd/reviews', payload)
  return response.data
}

export const getBookings = async () => {
  const response = await axios.get('/api/erd/bookings')
  return response.data?.data || []
}

export const createBooking = async (payload: {
  userId: string
  accommodationId: string
  startDate: string
  endDate: string
  totalPrice: number
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}) => {
  const response = await axios.post('/api/erd/bookings', payload)
  return response.data
}

export const initiateEsewaPayment = async (payload: {
  accommodationId?: string
  experienceId?: string
  startDate: string
  endDate: string
}) => {
  const response = await axios.post('/api/payment/esewa/initiate', payload)
  return response.data
}

export const cancelPendingBooking = async (bookingId: string) => {
  const response = await axios.post('/api/payment/cancel-booking', { bookingId })
  return response.data
}

export const cancelBooking = async (bookingId: string) => {
  const response = await axios.put(`/api/erd/bookings/${bookingId}`, { status: 'cancelled' })
  return response.data
}

export const getActiveBookingsForListing = async (listingId: string, kind: 'accommodation' | 'experience') => {
  const response = await axios.get(`/api/erd/bookings/listing/${listingId}`, {
    params: { kind }
  })
  return response.data?.data || []
}

