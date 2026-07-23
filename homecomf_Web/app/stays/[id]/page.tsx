"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { MapPin, Star, Users, Heart, ShieldCheck } from "lucide-react"
import StayLocationMap, { StayCoordinates } from "@/app/components/stay-location-map"
import { verify } from "@/lib/api/auth"
import {
  cancelPendingBooking,
  createAccommodationReview,
  getActiveBookingsForListing,
  getBookings,
  getAccommodationReviews,
  getHostProfileById,
  getPublicListingById,
} from "@/lib/api/listings"
import { getWishlist, toggleWishlistItem } from "@/lib/api/wishlist"
import { createReport } from "@/lib/api/reports"

interface ListingReview {
  _id?: string
  rating: number
  comment?: string
  userName?: string | { name?: string }
  userId?: string | { _id?: string; name?: string; image?: string }
  accommodationId?: string | { _id?: string }
}

interface Listing {
  _id: string
  title: string
  location: string
  price: number
  weekendPrice?: number
  description?: string
  images: string[]
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities?: string[]
  hostName?: string
  hostId?: string | { _id?: string; legalName?: string; userId?: string | { _id?: string; image?: string } }
  reviews?: ListingReview[]
}

interface Booking {
  _id?: string
  userId?: string | { _id?: string }
  accommodationId?: string | { _id?: string }
  startDate: string
  endDate: string
  status?: "pending" | "confirmed" | "cancelled" | "completed"
}

interface CurrentUser {
  _id: string
  role?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/images/logo.png"
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

const normalizeId = (value: unknown) => {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id?: unknown })._id || "")
  }
  return ""
}

const hasDateOverlap = (startA: Date, endA: Date, startB: Date, endB: Date) => startA < endB && endA > startB

const isBookingActiveNow = (booking: Booking) => {
  const status = booking.status || ""
  const statusActive = status === "pending" || status === "confirmed"
  if (!statusActive) return false

  const checkout = new Date(booking.endDate)
  if (Number.isNaN(checkout.getTime())) return false
  const checkoutDay = new Date(checkout.getFullYear(), checkout.getMonth(), checkout.getDate())

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return checkoutDay.getTime() >= today.getTime()
}

export default function StayDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [hostName, setHostName] = useState("homecomf host")
  const [hostImage, setHostImage] = useState<string | null>(null)
  const [hostUserId, setHostUserId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ListingReview[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showAllImages, setShowAllImages] = useState(false)
  const [coordinates, setCoordinates] = useState<StayCoordinates>({ lat: 27.7172, lng: 85.324 })
  const [checkInDate, setCheckInDate] = useState("")
  const [checkOutDate, setCheckOutDate] = useState("")
  const [guestCount, setGuestCount] = useState(1)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportProblem, setReportProblem] = useState("")
  const [reportError, setReportError] = useState<string | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Clean up any stale pending booking from a previous payment attempt
    const staleBookingId = sessionStorage.getItem('pendingBookingId')
    if (staleBookingId) {
      cancelPendingBooking(staleBookingId).catch(() => {})
      sessionStorage.removeItem('pendingBookingId')
    }

    const load = async () => {
      try {
        const res = await getPublicListingById(params.id as string)
        const loadedListing = res.data as Listing
        setListing(loadedListing)

        const nextHostId =
          typeof loadedListing.hostId === "string"
            ? loadedListing.hostId
            : loadedListing.hostId?._id

        const nextHostName =
          typeof loadedListing.hostId === "object"
            ? loadedListing.hostId?.legalName?.trim()
            : ""

        const nextHostUserId =
          typeof loadedListing.hostId === "object"
            ? typeof loadedListing.hostId.userId === "string"
              ? loadedListing.hostId.userId
              : loadedListing.hostId.userId?._id
            : null

        const [reviewsData, userData, hostProfileData, bookingsData, listingBookingsData] = await Promise.all([
          getAccommodationReviews(loadedListing._id),
          verify().catch(() => null),
          nextHostId ? getHostProfileById(nextHostId).catch(() => null) : Promise.resolve(null),
          getBookings().catch(() => []),
          getActiveBookingsForListing(loadedListing._id, 'accommodation').catch(() => []),
        ])

        setReviews(reviewsData)
        // Merge user bookings + listing-level bookings (deduped by _id)
        const userBookings = Array.isArray(bookingsData) ? bookingsData : []
        const allBookings = Array.isArray(listingBookingsData) ? listingBookingsData : []
        const userBookingIds = new Set(userBookings.map((b: any) => b._id))
        const merged = [
          ...userBookings,
          ...allBookings.filter((b: any) => !userBookingIds.has(b._id)),
        ]
        setBookings(merged)

        const safeUser = userData?.user && userData.user._id ? (userData.user as CurrentUser) : null
        setCurrentUser(safeUser)

        if (nextHostName) {
          setHostName(nextHostName)
        } else if (hostProfileData?.data?.legalName?.trim()) {
          setHostName(hostProfileData.data.legalName.trim())
        } else if (loadedListing.hostName?.trim()) {
          setHostName(loadedListing.hostName.trim())
        }

        const resolvedHostImage =
          typeof loadedListing.hostId === "object"
            ? typeof loadedListing.hostId.userId === "object"
              ? loadedListing.hostId.userId?.image
              : undefined
            : undefined

        const hostProfileImage =
          typeof hostProfileData?.data?.userId === "object"
            ? hostProfileData.data.userId?.image
            : undefined

        setHostImage(resolvedHostImage || hostProfileImage || null)

        const hostProfileUserId =
          typeof hostProfileData?.data?.userId === "string"
            ? hostProfileData.data.userId
            : hostProfileData?.data?.userId?._id

        if (nextHostUserId) {
          setHostUserId(nextHostUserId)
        } else if (hostProfileUserId) {
          setHostUserId(hostProfileUserId)
        }

        const geocodeResponse = await fetch(
          `/api/geocode?type=search&limit=1&q=${encodeURIComponent(loadedListing.location)}`,
        )
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json()
          if (Array.isArray(geocodeData) && geocodeData.length > 0) {
            const lat = Number(geocodeData[0].lat)
            const lng = Number(geocodeData[0].lon)
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              setCoordinates({ lat, lng })
            }
          }
        }
      } catch (err) {
        console.error("Failed to load listing", err)
        setError("Unable to load this stay right now.")
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      load()
    }
  }, [params.id])

  useEffect(() => {
    if (!listing?._id) return
    getWishlist().then((ids) => setIsSaved(ids.includes(listing!._id)))
  }, [listing?._id])

  const isHostViewing = useMemo(() => {
    if (!currentUser?._id || !hostUserId) return false
    return currentUser._id === hostUserId
  }, [currentUser, hostUserId])

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 1
    const inDate = new Date(checkInDate)
    const outDate = new Date(checkOutDate)
    const diffMs = outDate.getTime() - inDate.getTime()
    if (Number.isNaN(diffMs) || diffMs <= 0) return 1
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }, [checkInDate, checkOutDate])

  const hasExistingBookingByCurrentUser = useMemo(() => {
    if (!listing?._id || !currentUser?._id) return false
    return bookings.some((booking) => {
      const bookingAccommodationId = normalizeId(booking.accommodationId)
      const bookingUserId = normalizeId(booking.userId)
      return isBookingActiveNow(booking) && bookingAccommodationId === listing._id && bookingUserId === currentUser._id
    })
  }, [bookings, currentUser?._id, listing?._id])

  const isSelectedDateReservedByCurrentUser = useMemo(() => {
    if (!listing?._id || !currentUser?._id || !checkInDate || !checkOutDate) return false
    const selectedStart = new Date(checkInDate)
    const selectedEnd = new Date(checkOutDate)
    if (Number.isNaN(selectedStart.getTime()) || Number.isNaN(selectedEnd.getTime()) || selectedEnd <= selectedStart) {
      return false
    }

    return bookings.some((booking) => {
      const bookingAccommodationId = normalizeId(booking.accommodationId)
      const bookingUserId = normalizeId(booking.userId)
      if (!isBookingActiveNow(booking) || bookingAccommodationId !== listing._id || bookingUserId !== currentUser._id) return false

      const bookingStart = new Date(booking.startDate)
      const bookingEnd = new Date(booking.endDate)
      if (Number.isNaN(bookingStart.getTime()) || Number.isNaN(bookingEnd.getTime())) return false
      return hasDateOverlap(selectedStart, selectedEnd, bookingStart, bookingEnd)
    })
  }, [bookings, checkInDate, checkOutDate, currentUser?._id, listing?._id])

  const isSelectedDateBookedByOthers = useMemo(() => {
    if (!listing?._id || !checkInDate || !checkOutDate) return false
    const selectedStart = new Date(checkInDate)
    const selectedEnd = new Date(checkOutDate)
    if (Number.isNaN(selectedStart.getTime()) || Number.isNaN(selectedEnd.getTime()) || selectedEnd <= selectedStart) {
      return false
    }

    return bookings.some((booking) => {
      const bookingAccommodationId = normalizeId(booking.accommodationId)
      const bookingUserId = normalizeId(booking.userId)
      if (!isBookingActiveNow(booking) || bookingAccommodationId !== listing._id) return false
      if (currentUser?._id && bookingUserId === currentUser._id) return false

      const bookingStart = new Date(booking.startDate)
      const bookingEnd = new Date(booking.endDate)
      if (Number.isNaN(bookingStart.getTime()) || Number.isNaN(bookingEnd.getTime())) return false
      return hasDateOverlap(selectedStart, selectedEnd, bookingStart, bookingEnd)
    })
  }, [bookings, checkInDate, checkOutDate, currentUser?._id, listing?._id])

  const reservationStatus = searchParams.get("reservation")
  const paidAmountRaw = searchParams.get("paid")
  const paidAmount = paidAmountRaw && !Number.isNaN(Number(paidAmountRaw)) ? Number(paidAmountRaw).toFixed(2) : null

  useEffect(() => {
    if (reservationStatus === "success") {
      setShowSuccessPopup(true)
    }
  }, [reservationStatus])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-zinc-200 rounded-full mb-4"></div>
          <div className="text-zinc-500 font-semibold tracking-tight">Loading stay details...</div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="text-slate-900 bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm text-center">
          <p className="text-zinc-500 font-bold text-lg">{error || "Stay not found."}</p>
          <Link href="/" className="text-[#FF5A1F] hover:underline mt-4 inline-block font-semibold">Go back home</Link>
        </div>
      </div>
    )
  }

  const allImageUrls = (listing.images || []).map((image) => getImageUrl(image))
  const displayImageUrls = showAllImages ? allImageUrls : allImageUrls.slice(0, 5)
  const primaryImage = displayImageUrls[0] || "/images/logo.png"
  const galleryImages = displayImageUrls.slice(1, 5)
  const resolvedReviews = reviews.length ? reviews : Array.isArray(listing.reviews) ? listing.reviews : []
  const averageRating = resolvedReviews.length
    ? (resolvedReviews.reduce((sum, review) => sum + review.rating, 0) / resolvedReviews.length).toFixed(1)
    : "0.0"
  const reviewsCountLabel = `(${resolvedReviews.length})`
  const amenities = listing.amenities?.length ? listing.amenities : ["Wifi", "Kitchen", "Free parking on premises", "Hot water"]
  const totalBeforeTaxes = listing.price * nights
  const reserveHref = `/stays/${listing._id}/reserve?checkIn=${encodeURIComponent(checkInDate)}&checkOut=${encodeURIComponent(checkOutDate)}&guests=${guestCount}`

  const availabilityLabel = hasExistingBookingByCurrentUser
    ? "Booked by you"
    : !checkInDate || !checkOutDate
    ? "Select dates to check availability"
    : isSelectedDateReservedByCurrentUser
      ? "Booked by you"
      : isSelectedDateBookedByOthers
        ? "Not available for selected dates"
        : `Available: ${new Date(checkInDate).toLocaleDateString()} - ${new Date(checkOutDate).toLocaleDateString()}`

  const handleToggleSave = async () => {
    if (!listing?._id) return
    setIsSaved((prev) => !prev)
    const result = await toggleWishlistItem(listing._id)
    setIsSaved(result.data.includes(listing._id))
  }

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!currentUser?._id) {
      setReviewError("Please login to write a review.")
      return
    }

    try {
      setReviewSubmitting(true)
      setReviewError(null)

      await createAccommodationReview({
        userId: currentUser._id,
        accommodationId: listing._id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      })

      const updatedReviews = await getAccommodationReviews(listing._id)
      setReviews(updatedReviews)
      setReviewComment("")
      setReviewRating(5)
    } catch (submitError: any) {
      setReviewError(submitError?.response?.data?.message || "Unable to submit review right now.")
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleReportStay = async () => {
    if (!currentUser?._id || !listing) {
      window.alert("Please login to report this stay.")
      return
    }

    setReportProblem("")
    setReportError(null)
    setReportModalOpen(true)
  }

  const submitStayReport = async () => {
    if (!listing) return
    const problem = reportProblem.trim()
    if (!problem) {
      setReportError("Please describe the issue before submitting.")
      return
    }

    try {
      setReportSubmitting(true)
      setReportError(null)
      await createReport({
        reportType: "stay",
        hostName,
        location: listing.location,
        problem,
        itemId: listing._id,
        itemTitle: listing.title,
        sourcePlatform: "web",
      })
      setReportModalOpen(false)
      setReportProblem("")
      window.alert("Report submitted successfully.")
    } catch (reportError: any) {
      setReportError(reportError?.response?.data?.message || "Unable to submit report right now.")
    } finally {
      setReportSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 md:py-12 space-y-8">
        {showSuccessPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-zinc-100 transform transition-all">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-900 mb-2">Payment successful</h3>
              <p className="text-zinc-600 font-medium whitespace-pre-line leading-relaxed">
                NPR {paidAmount || "0.00"} paid successfully through eSewa.
                <br/>Stay booked successfully.
              </p>
              <button
                type="button"
                onClick={() => setShowSuccessPopup(false)}
                className="mt-8 w-full rounded-full bg-[#FF5A1F] px-5 py-3.5 text-[15px] font-extrabold text-white hover:bg-[#e44e1a] hover:shadow-[0_8px_20px_rgba(255,90,31,0.25)] transition-all scale-95 hover:scale-100"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-zinc-100">
              <h3 className="text-2xl font-extrabold text-zinc-900 mb-2">Report this stay</h3>
              <p className="text-zinc-500 font-medium mb-6">Describe the inconvenience you faced.</p>
              <textarea
                value={reportProblem}
                onChange={(event) => setReportProblem(event.target.value)}
                placeholder="Tell us what went wrong..."
                rows={5}
                className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50/50 p-4 font-medium text-zinc-900 outline-none focus:border-[#FF5A1F] focus:bg-white transition-all resize-none"
              />
              {reportError && <p className="mt-3 text-sm font-semibold text-red-500">{reportError}</p>}
              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (reportSubmitting) return
                    setReportModalOpen(false)
                    setReportError(null)
                  }}
                  className="rounded-full px-6 py-3 text-[15px] font-extrabold text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitStayReport}
                  disabled={reportSubmitting}
                  className="rounded-full bg-[#FF5A1F] px-8 py-3 text-[15px] font-extrabold text-white hover:bg-[#e44e1a] hover:shadow-[0_8px_20px_rgba(255,90,31,0.25)] transition-all disabled:opacity-60 disabled:hover:scale-100 scale-95 hover:scale-100"
                >
                  {reportSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
        {reservationStatus === "failed" && (
          <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-4 text-red-600 font-semibold flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Reservation payment failed. Please try again.
          </div>
        )}

        {/* Header: title + actions */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[15px] font-medium text-zinc-600">
              <div className="flex items-center gap-1.5 focus:outline-none">
                <Star className="w-5 h-5 fill-[#FF5A1F] text-[#FF5A1F]" />
                <span className="font-extrabold text-zinc-900">{averageRating}</span>
                <span className="text-zinc-500 underline decoration-zinc-300 underline-offset-4">{reviewsCountLabel} reviews</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-zinc-400" />
                <span className="underline decoration-zinc-300 underline-offset-4">{listing.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 md:pt-0">
            <button onClick={handleToggleSave} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200">
              <Heart className={`w-5 h-5 ${isSaved ? "fill-[#FF5A1F] text-[#FF5A1F]" : "text-zinc-700"}`} />
              <span className="font-bold text-sm text-zinc-700">{isSaved ? "Saved to Wishlist" : "Save"}</span>
            </button>
          </div>
        </header>

        {/* Gallery */}
        <section className="relative">
          <div className="grid grid-cols-4 gap-2 md:gap-3 rounded-[2rem] overflow-hidden">
            <div className="col-span-4 md:col-span-2 relative h-[300px] md:h-[500px]">
              <img
                src={primaryImage}
                alt={listing.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                onError={(event) => {
                  event.currentTarget.src = "/images/logo.png"
                }}
              />
            </div>
            <div className="hidden md:grid md:col-span-2 grid-cols-2 grid-rows-2 gap-2 md:gap-3">
              {galleryImages.map((img, idx) => (
                <div key={idx} className="relative h-[244px] overflow-hidden">
                  <img
                    src={img}
                    alt={`${listing.title} ${idx + 2}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700 ease-out"
                    onError={(event) => {
                      event.currentTarget.src = "/images/logo.png"
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          {allImageUrls.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllImages((prev) => !prev)}
              className="absolute bottom-6 right-6 rounded-full bg-white/90 backdrop-blur-md px-6 py-2.5 text-sm font-extrabold text-zinc-900 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-white hover:scale-105 transition-all flex items-center gap-2 border border-zinc-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              {showAllImages ? "Show less" : `Show all photos`}
            </button>
          )}
        </section>

        {/* Main content + booking sidebar */}
        <main className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-12 lg:gap-20 mt-8 md:mt-12">
          {/* Left: details */}
          <div className="space-y-10">
            {/* Summary block */}
            <section className="border-b border-zinc-100 pb-10">
              <h2 className="text-2xl font-extrabold text-zinc-900 mb-4 tracking-tight">Entire place hosted</h2>
              <div className="flex flex-wrap items-center gap-4 text-[15px] font-medium text-zinc-600">
                <span className="bg-zinc-100 px-4 py-2 rounded-full text-zinc-900 font-bold">{listing.maxGuests} guests</span>
                <span>·</span>
                <span>{listing.bedrooms} bedroom{listing.bedrooms !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{listing.beds} bed{listing.beds !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}</span>
              </div>
              <div className="mt-6 flex gap-4 p-5 rounded-[1.5rem] bg-zinc-50 border border-zinc-100">
                <ShieldCheck className="w-8 h-8 text-[#FF5A1F] shrink-0" />
                <div>
                  <h4 className="font-extrabold text-zinc-900 mb-1">Peace of mind</h4>
                  <p className="text-sm font-medium text-zinc-600">Every stay is protected with homecomf guest support and verification.</p>
                </div>
              </div>
            </section>

            <section className="border-b border-zinc-100 pb-10">
              <h3 className="text-2xl font-extrabold text-zinc-900 mb-6 tracking-tight">What this place offers</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[15px] font-medium text-zinc-700">

                {amenities.slice(0, 8).map((item) => (
                  <span key={item}>✔ {item}</span>
                ))}
              </div>
            </section>

            <section className="border-b border-zinc-200 pb-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Hosted by</h3>
              <div className="flex items-center gap-3">
                {hostImage ? (
                  <img
                    src={getImageUrl(hostImage)}
                    alt={hostName}
                    className="w-12 h-12 rounded-full object-cover border border-zinc-200"
                    onError={(event) => {
                      event.currentTarget.src = "/images/logo.png"
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-700">
                    {hostName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-900">{hostName}</p>
                  <p className="text-xs text-zinc-500">Verified host on homecomf</p>
                  {hostUserId && !isHostViewing && (
                    <Link
                      href={`/messages?recipientId=${encodeURIComponent(hostUserId)}&recipientName=${encodeURIComponent(hostName)}&accommodationId=${encodeURIComponent(listing._id)}&contextTitle=${encodeURIComponent(listing.title)}`}
                      className="inline-block mt-2 text-xs font-semibold text-[#FF5A1F] hover:underline"
                    >
                      Message host
                    </Link>
                  )}
                  {!isHostViewing && (
                    <button
                      type="button"
                      onClick={handleReportStay}
                      disabled={reportSubmitting}
                      className="block mt-2 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                    >
                      {reportSubmitting ? "Submitting report..." : "Report this stay"}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Description */}
            {listing.description && (
              <section className="border-b border-zinc-200 pb-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Description</h3>
                <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">
                  {listing.description}
                </p>
              </section>
            )}

            <section className="border-b border-zinc-200 pb-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-3">Reviews</h3>
              {resolvedReviews.length > 0 ? (
                <div className="space-y-4">
                  {resolvedReviews.slice(0, 3).map((review, index) => {
                    const reviewUserName =
                      typeof review.userName === "string"
                        ? review.userName
                        : typeof review.userId === "object"
                          ? review.userId?.name || "Guest"
                          : "Guest"

                    const reviewUserImage =
                      typeof review.userId === "object"
                        ? review.userId?.image
                        : undefined

                    return (
                      <div key={review._id || `${reviewUserName}-${index}`} className="rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {reviewUserImage ? (
                              <img
                                src={getImageUrl(reviewUserImage)}
                                alt={reviewUserName}
                                className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                                onError={(event) => {
                                  event.currentTarget.src = "/images/logo.png"
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-700">
                                {reviewUserName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <p className="text-sm font-medium text-zinc-900">{reviewUserName}</p>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-700">
                            <Star className="w-4 h-4 fill-[#FF5A1F] text-[#FF5A1F]" />
                            <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-700">{review.comment || ""}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">No reviews yet. Be the first to share your stay experience.</p>
              )}

              {!isHostViewing && (
                <form onSubmit={handleSubmitReview} className="mt-5 rounded-xl border border-zinc-200 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-zinc-900">Write a review</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] gap-3">
                    <select
                      value={reviewRating}
                      onChange={(event) => setReviewRating(Number(event.target.value))}
                      className="h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} Star{value > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      className="h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900"
                      placeholder="Share your stay experience"
                    />
                  </div>
                  {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="inline-flex items-center justify-center bg-[#FF5A1F] text-white rounded-lg h-10 px-4 text-sm font-medium hover:bg-[#e44e1a] disabled:opacity-60"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit review"}
                  </button>
                </form>
              )}
            </section>

            <section className="border-b border-zinc-200 pb-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-3">Location</h3>
              <p className="text-sm text-zinc-700 mb-4">{listing.location}</p>
              <StayLocationMap coordinates={coordinates} title={listing.title} />
            </section>
          </div>

          {/* Right: booking card */}
          <aside className="md:sticky md:top-24 h-max">
            <div className="border border-zinc-200 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-5 space-y-4">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-2xl font-semibold text-zinc-900">
                    Rs. {listing.price}
                    <span className="text-sm font-normal text-zinc-600"> night</span>
                  </div>
                  {listing.weekendPrice && listing.weekendPrice > listing.price && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Weekend price: Rs. {listing.weekendPrice}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-600">
                  <Star className="w-4 h-4 fill-[#FF5A1F] text-[#FF5A1F]" />
                  <span className="font-medium">{averageRating}</span>
                  <span className="text-zinc-400">{reviewsCountLabel}</span>
                </div>
              </div>

              {/* Dates & guests (UI only for now) */}
              <div className="border border-zinc-300 rounded-xl text-sm text-zinc-700 overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-zinc-200">
                  <div className="p-3">
                    <div className="text-[11px] font-semibold uppercase text-zinc-500">Check-in</div>
                    <input
                      type="date"
                      value={checkInDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(event) => setCheckInDate(event.target.value)}
                      className="h-6 w-full bg-transparent text-zinc-900 outline-none"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] font-semibold uppercase text-zinc-500">Check-out</div>
                    <input
                      type="date"
                      value={checkOutDate}
                      min={checkInDate || new Date().toISOString().split("T")[0]}
                      onChange={(event) => setCheckOutDate(event.target.value)}
                      className="h-6 w-full bg-transparent text-zinc-900 outline-none"
                    />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between px-3 py-3 border-t border-zinc-200">
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-zinc-500">Guests</div>
                    <div className="text-zinc-900">{guestCount} guest{guestCount > 1 ? "s" : ""}</div>
                  </div>
                  <input
                    type="number"
                    value={guestCount}
                    min={1}
                    max={Math.max(1, listing.maxGuests)}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      if (Number.isNaN(value)) return
                      const nextCount = Math.min(Math.max(value, 1), Math.max(1, listing.maxGuests))
                      setGuestCount(nextCount)
                    }}
                    className="h-9 w-20 rounded-lg border border-zinc-300 px-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs text-zinc-700">
                Available dates: {availabilityLabel}
              </div>

              {reservationStatus === "success" || hasExistingBookingByCurrentUser || isSelectedDateReservedByCurrentUser ? (
                <button
                  type="button"
                  disabled
                  className="block w-full bg-[#FF5A1F]/70 text-white rounded-xl py-3.5 font-semibold text-sm text-center cursor-not-allowed"
                >
                  Booked
                </button>
              ) : isSelectedDateBookedByOthers ? (
                <button
                  type="button"
                  disabled
                  className="block w-full bg-red-300 text-red-900 rounded-xl py-3.5 font-semibold text-sm text-center cursor-not-allowed"
                >
                  Booked for selected dates
                </button>
              ) : isHostViewing ? (
                <button
                  type="button"
                  disabled
                  className="block w-full bg-zinc-300 text-zinc-700 rounded-xl py-3.5 font-semibold text-sm text-center cursor-not-allowed"
                >
                  Your Listing
                </button>
              ) : (
                <Link
                  href={reserveHref}
                  className="block w-full bg-[#FF5A1F] text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-[#e44e1a] shadow-md shadow-orange-200 text-center"
                >
                  Reserve
                </Link>
              )}
              <p className="text-center text-xs text-zinc-500">You won&apos;t be charged yet</p>

              <div className="pt-3 border-t border-zinc-200 text-xs text-zinc-600 space-y-1">
                <div className="flex justify-between">
                  <span>Rs. {listing.price} x {nights} night{nights > 1 ? "s" : ""}</span>
                  <span>Rs. {totalBeforeTaxes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>Rs. 0</span>
                </div>
                <div className="flex justify-between font-semibold text-zinc-900 pt-1 border-t border-dashed border-zinc-200 mt-1">
                  <span>Total before taxes</span>
                  <span>Rs. {totalBeforeTaxes}</span>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}



