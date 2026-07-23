"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { MapPin, Star, Users, Heart } from "lucide-react"
import StayLocationMap, { StayCoordinates } from "@/app/components/stay-location-map"
import { verify } from "@/lib/api/auth"
import { cancelPendingBooking, getActiveBookingsForListing, getBookings, getExperienceReviews, getHostProfileById, getPublicExperienceById, createExperienceReview } from "@/lib/api/listings"
import { createReport } from "@/lib/api/reports"
import { getWishlist, toggleWishlistItem } from "@/lib/api/wishlist"

interface Experience {
  _id: string
  title: string
  category?: string
  location: string
  price: number
  images: string[]
  description?: string
  duration?: string
  yearsOfExperience?: number
  maxGuests?: number
  itinerary?: Array<{ title?: string; description?: string; duration?: string }>
  availableDates?: Array<string | Date>
  hostId?: string | { _id?: string; userId?: string | { _id?: string; name?: string; image?: string } }
}

interface HostProfile {
  _id?: string
  legalName?: string
  userId?: { _id?: string; name?: string; image?: string }
}

interface ExperienceReview {
  _id?: string
  rating: number
  comment?: string
  userId?: string | { _id?: string; name?: string; image?: string }
  experienceId?: string | { _id?: string }
}

interface Booking {
  _id?: string
  userId?: string | { _id?: string }
  experienceId?: string | { _id?: string }
  startDate: string
  endDate: string
  status?: "pending" | "confirmed" | "cancelled" | "completed"
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

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function ExperienceDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [experience, setExperience] = useState<Experience | null>(null)
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null)
  const [hostName, setHostName] = useState("Experience Host")
  const [hostImage, setHostImage] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [hostUserId, setHostUserId] = useState<string>("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<ExperienceReview[]>([])
  const [coordinates, setCoordinates] = useState<StayCoordinates>({ lat: 27.7172, lng: 85.324 })
  const [isSaved, setIsSaved] = useState(false)
  const [showAllImages, setShowAllImages] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportProblem, setReportProblem] = useState("")
  const [reportError, setReportError] = useState<string | null>(null)
  
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [guests, setGuests] = useState(1)

  useEffect(() => {
    // Clean up any stale pending booking from a previous payment attempt
    const staleBookingId = sessionStorage.getItem('pendingBookingId')
    if (staleBookingId) {
      cancelPendingBooking(staleBookingId).catch(() => {})
      sessionStorage.removeItem('pendingBookingId')
    }

    const load = async () => {
      try {
        const [experienceRes, authRes, bookingRes, listingBookingsRes] = await Promise.all([
          getPublicExperienceById(params.id as string),
          verify().catch(() => null),
          getBookings().catch(() => []),
          getActiveBookingsForListing(params.id as string, 'experience').catch(() => []),
        ])

        const loaded = experienceRes?.data as Experience
        setExperience(loaded)
        // Merge user bookings + listing-level bookings (deduped by _id)
        const userBookings = Array.isArray(bookingRes) ? bookingRes : []
        const allBookings = Array.isArray(listingBookingsRes) ? listingBookingsRes : []
        const userBookingIds = new Set(userBookings.map((b: any) => b._id))
        setBookings([
          ...userBookings,
          ...allBookings.filter((b: any) => !userBookingIds.has(b._id)),
        ])
        const loadedReviews = await getExperienceReviews(loaded._id).catch(() => [])
        setReviews(Array.isArray(loadedReviews) ? loadedReviews : [])

        const userId = authRes?.user?._id ? String(authRes.user._id) : ""
        setCurrentUserId(userId)

        const hostProfileId = normalizeId(loaded?.hostId)
        if (hostProfileId) {
          const hostProfileRes = await getHostProfileById(hostProfileId).catch(() => null)
          if (hostProfileRes?.data) {
            const profile = hostProfileRes.data as HostProfile
            setHostProfile(profile)

            if (profile.legalName?.trim()) {
              setHostName(profile.legalName.trim())
            }

            const resolvedUserData = typeof profile.userId === "object" ? profile.userId : null
            const resolvedHostUserId = resolvedUserData?._id || (typeof profile.userId === "string" ? profile.userId : "")
            setHostUserId(resolvedHostUserId)

            if (resolvedUserData?.image) {
              setHostImage(resolvedUserData.image)
            }
          }
        }

        const geocodeResponse = await fetch(
          `/api/geocode?type=search&limit=1&q=${encodeURIComponent(loaded.location)}`,
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
        console.error("Failed to load experience", err)
        setError("Unable to load this experience right now.")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      load()
    }
  }, [params.id])

  const isHostViewing = useMemo(() => {
    if (!currentUserId || !hostUserId) return false
    return currentUserId === hostUserId
  }, [currentUserId, hostUserId])

  const hasExistingBookingByCurrentUser = useMemo(() => {
    if (!experience?._id || !currentUserId) return false
    return bookings.some((booking) => {
      const bookingUserId = normalizeId(booking.userId)
      const bookingExperienceId = normalizeId(booking.experienceId)
      return isBookingActiveNow(booking) && bookingUserId === currentUserId && bookingExperienceId === experience._id
    })
  }, [bookings, currentUserId, experience?._id])

  const isSelectedDateReservedByCurrentUser = useMemo(() => {
    if (!experience?._id || !currentUserId || !startDate || !endDate) return false
    const selectedStart = new Date(startDate)
    const selectedEnd = new Date(endDate)
    if (Number.isNaN(selectedStart.getTime()) || Number.isNaN(selectedEnd.getTime()) || selectedEnd <= selectedStart) {
      return false
    }

    return bookings.some((booking) => {
      const bookingUserId = normalizeId(booking.userId)
      const bookingExperienceId = normalizeId(booking.experienceId)
      if (!isBookingActiveNow(booking) || bookingUserId !== currentUserId || bookingExperienceId !== experience._id) return false
      const bookingStart = new Date(booking.startDate)
      const bookingEnd = new Date(booking.endDate)
      if (Number.isNaN(bookingStart.getTime()) || Number.isNaN(bookingEnd.getTime())) return false
      return hasDateOverlap(selectedStart, selectedEnd, bookingStart, bookingEnd)
    })
  }, [bookings, currentUserId, endDate, experience?._id, startDate])

  const isSelectedDateBookedByOthers = useMemo(() => {
    if (!experience?._id || !startDate || !endDate) return false

    const selectedStart = new Date(startDate)
    const selectedEnd = new Date(endDate)

    if (Number.isNaN(selectedStart.getTime()) || Number.isNaN(selectedEnd.getTime()) || selectedEnd <= selectedStart) {
      return false
    }

    return bookings.some((booking) => {
      const bookingExperienceId = normalizeId(booking.experienceId)
      const bookingUserId = normalizeId(booking.userId)
      if (!isBookingActiveNow(booking) || bookingExperienceId !== experience._id) return false
      if (currentUserId && bookingUserId === currentUserId) return false

      const bookingStart = new Date(booking.startDate)
      const bookingEnd = new Date(booking.endDate)
      if (Number.isNaN(bookingStart.getTime()) || Number.isNaN(bookingEnd.getTime())) return false

      return hasDateOverlap(selectedStart, selectedEnd, bookingStart, bookingEnd)
    })
  }, [bookings, currentUserId, endDate, experience?._id, startDate])

  const reservationStatus = searchParams.get("reservation")
  const allImageUrls = (experience?.images || []).map((image) => getImageUrl(image))
  const displayImageUrls = showAllImages ? allImageUrls : allImageUrls.slice(0, 5)
  const primaryImage = displayImageUrls[0] || "/images/logo.png"
  const galleryImages = displayImageUrls.slice(1, 5)
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0"
  const reviewsCountLabel = `(${reviews.length})`
  const availableDateKeys = useMemo(() => {
    if (!experience?.availableDates?.length) return new Set<string>()
    return new Set(
      experience.availableDates
        .map((date) => new Date(date))
        .filter((date) => !Number.isNaN(date.getTime()))
        .map((date) => toDateKey(date)),
    )
  }, [experience?.availableDates])

  const isSelectedDateOutsideAvailability = useMemo(() => {
    if (!experience?.availableDates?.length) return false
    if (!startDate || !endDate) return false

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return false

    const cursor = new Date(start)
    while (cursor < end) {
      const key = toDateKey(cursor)
      if (!availableDateKeys.has(key)) return true
      cursor.setDate(cursor.getDate() + 1)
    }
    return false
  }, [availableDateKeys, endDate, experience?.availableDates?.length, startDate])

  useEffect(() => {
    if (!experience?._id) return
    getWishlist().then((ids) => setIsSaved(ids.includes(experience!._id)))
  }, [experience?._id])

  useEffect(() => {
    if (reservationStatus === "success") {
      setShowSuccessPopup(true)
    }
  }, [reservationStatus])

  const handleToggleSave = async () => {
    if (!experience?._id) return
    setIsSaved((prev) => !prev)
    const result = await toggleWishlistItem(experience._id)
    setIsSaved(result.data.includes(experience._id))
  }

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!currentUserId) {
      setReviewError("Please login to write a review.")
      return
    }

    try {
      setReviewSubmitting(true)
      setReviewError(null)

      if (!experience?._id) return

      await createExperienceReview({
        userId: currentUserId,
        experienceId: experience._id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      })

      const updatedReviews = await getExperienceReviews(experience._id)
      setReviews(Array.isArray(updatedReviews) ? updatedReviews : [])
      setReviewComment("")
      setReviewRating(5)
    } catch (submitError: any) {
      setReviewError(submitError?.response?.data?.message || "Unable to submit review right now.")
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleReportExperience = async () => {
    if (!currentUserId || !experience) {
      window.alert("Please login to report this experience.")
      return
    }

    setReportProblem("")
    setReportError(null)
    setReportModalOpen(true)
  }

  const submitExperienceReport = async () => {
    if (!experience) return
    const problem = reportProblem.trim()
    if (!problem) {
      setReportError("Please describe the issue before submitting.")
      return
    }

    try {
      setReportSubmitting(true)
      setReportError(null)
      await createReport({
        reportType: "experience",
        hostName,
        location: experience.location,
        problem,
        itemId: experience._id,
        itemTitle: experience.title,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading experience details...</p>
      </div>
    )
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{error || "Experience not found."}</p>
      </div>
    )
  }

  const reserveHref = `/experiences/${experience._id}/reserve?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&guests=${guests}`
  const paidAmountRaw = searchParams.get("paid")
  const paidAmount = paidAmountRaw && !Number.isNaN(Number(paidAmountRaw)) ? Number(paidAmountRaw).toFixed(2) : null

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {showSuccessPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-zinc-900">Payment successful</h3>
              <p className="mt-2 text-sm text-zinc-700">
                NPR {paidAmount || "0.00"} paid successfully through eSewa.
              </p>
              <p className="mt-1 text-sm text-zinc-700">Experience booked successfully.</p>
              <button
                type="button"
                onClick={() => setShowSuccessPopup(false)}
                className="mt-5 rounded-full bg-[#FF5A1F] px-5 py-2 text-sm font-medium text-white hover:bg-[#e44e1a]"
              >
                Okay
              </button>
            </div>
          </div>
        )}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-zinc-900">Report this experience</h3>
              <p className="mt-1 text-sm text-zinc-600">Describe the inconvenience you faced.</p>
              <textarea
                value={reportProblem}
                onChange={(event) => setReportProblem(event.target.value)}
                placeholder="Tell us what went wrong"
                rows={5}
                className="mt-4 w-full rounded-xl border border-zinc-300 p-3 text-sm outline-none focus:border-[#FF5A1F]"
              />
              {reportError && <p className="mt-2 text-xs text-red-600">{reportError}</p>}
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (reportSubmitting) return
                    setReportModalOpen(false)
                    setReportError(null)
                  }}
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitExperienceReport}
                  disabled={reportSubmitting}
                  className="rounded-full bg-[#FF5A1F] px-5 py-2 text-sm font-medium text-white hover:bg-[#e44e1a] disabled:opacity-60"
                >
                  {reportSubmitting ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </div>
          </div>
        )}
        {reservationStatus === "failed" && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
            Experience booking payment failed. Please try again.
          </div>
        )}

        {/* Header: title + location + actions */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900">{experience.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
              <button className="inline-flex items-center gap-1 hover:underline">
                <Star className="w-4 h-4 fill-[#FF5A1F] text-[#FF5A1F]" />
                <span className="font-medium">{averageRating}</span>
                <span className="text-zinc-500">{reviewsCountLabel}</span>
              </button>
              <span>·</span>
              <button className="inline-flex items-center gap-1 hover:underline">
                <MapPin className="w-4 h-4" />
                <span>{experience.location}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-700">
            <button onClick={handleToggleSave} className="inline-flex items-center gap-2 px-3 py-2 rounded-full hover:bg-zinc-100">
              <Heart className={`w-4 h-4 ${isSaved ? "fill-[#FF5A1F] text-[#FF5A1F]" : "text-zinc-700"}`} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </header>

        {/* Gallery */}
        <section className="grid grid-cols-4 gap-2 md:gap-3 rounded-3xl overflow-hidden border border-zinc-200">
          <div className="col-span-4 md:col-span-2 relative h-64 md:h-96">
            <img
              src={primaryImage}
              alt={experience.title}
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.src = "/images/logo.png"
              }}
            />
          </div>
          <div className="hidden md:grid md:col-span-2 grid-cols-2 grid-rows-2 gap-2">
            {galleryImages.map((img, idx) => (
              <div key={idx} className="relative h-44 overflow-hidden">
                <img
                  src={img}
                  alt={`${experience.title} ${idx + 2}`}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = "/images/logo.png"
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {allImageUrls.length > 5 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAllImages((prev) => !prev)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              {showAllImages ? "Show less images" : `See all images (${allImageUrls.length})`}
            </button>
          </div>
        )}

        {/* Main content + booking sidebar */}
        <main className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-10 mt-2 md:mt-4">
          {/* Left: details */}
          <div className="space-y-8">
            {/* Summary block */}
            <section className="border-b border-zinc-200 pb-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-1">Experience overview</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Up to {experience.maxGuests || 1} guest{experience.maxGuests !== 1 ? "s" : ""}</span>
                </div>
                <span>·</span>
                <span>{experience.duration || "Duration not specified"}</span>
                {experience.category && (
                  <>
                    <span>·</span>
                    <span>{experience.category}</span>
                  </>
                )}
                {typeof experience.yearsOfExperience === "number" && (
                  <>
                    <span>·</span>
                    <span>{experience.yearsOfExperience} year{experience.yearsOfExperience === 1 ? "" : "s"} experience</span>
                  </>
                )}
              </div>
            </section>

            {/* Description */}
            {experience.description && (
              <section className="border-b border-zinc-200 pb-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">About this experience</h3>
                <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">
                  {experience.description}
                </p>
              </section>
            )}

            {/* Hosted by */}
            <section className="border-b border-zinc-200 pb-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-3">Hosted by</h3>
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
                      href={`/messages?recipientId=${encodeURIComponent(hostUserId)}&recipientName=${encodeURIComponent(hostName)}&experienceId=${encodeURIComponent(experience._id)}&contextTitle=${encodeURIComponent(experience.title)}`}
                      className="inline-block mt-2 text-xs font-semibold text-[#FF5A1F] hover:underline"
                    >
                      Message host
                    </Link>
                  )}
                  {!isHostViewing && (
                    <button
                      type="button"
                      onClick={handleReportExperience}
                      disabled={reportSubmitting}
                      className="block mt-2 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                    >
                      {reportSubmitting ? "Submitting report..." : "Report this experience"}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {experience.itinerary?.length ? (
              <section className="border-b border-zinc-200 pb-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Itinerary</h3>
                <div className="space-y-4">
                  {experience.itinerary.map((item, index) => (
                    <div key={`${item.title || "step"}-${index}`} className="rounded-xl border border-zinc-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-zinc-900">{item.title || `Activity ${index + 1}`}</p>
                        {item.duration && <span className="text-xs text-zinc-500">{item.duration}</span>}
                      </div>
                      {item.description && <p className="text-sm text-zinc-700">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {experience.availableDates?.length ? (
              <section className="border-b border-zinc-200 pb-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Available dates</h3>
                <div className="flex flex-wrap gap-2">
                  {experience.availableDates
                    .map((date) => new Date(date))
                    .filter((date) => !Number.isNaN(date.getTime()))
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date) => (
                      <span key={date.toISOString()} className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700">
                        {date.toLocaleDateString()}
                      </span>
                    ))}
                </div>
              </section>
            ) : null}

            <section className="border-b border-zinc-200 pb-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-3">Reviews</h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review, index) => {
                    const reviewUserName =
                      typeof review.userId === "object"
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
                <p className="text-sm text-zinc-600">No reviews yet. Be the first to share your experience.</p>
              )}

              {(!(currentUserId && hostUserId && currentUserId === hostUserId)) && (
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
                      placeholder="Share your experience"
                      required
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

            {/* Location with Map */}
            <section className="border-b border-zinc-200 pb-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-3">Where to meet</h3>
              <p className="text-sm text-zinc-700 mb-4">{experience.location}</p>
              <StayLocationMap coordinates={coordinates} title={experience.title} />
            </section>
          </div>

          {/* Right: booking card */}
          <aside className="md:sticky md:top-24 h-max">
            <div className="border border-zinc-200 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-5 space-y-4">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-2xl font-semibold text-zinc-900">
                    Rs. {experience.price}
                  </div>
                  <div className="text-xs text-zinc-500">per person</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-600">
                  <Star className="w-4 h-4 fill-[#FF5A1F] text-[#FF5A1F]" />
                  <span className="font-medium">{averageRating}</span>
                  <span className="text-zinc-400">{reviewsCountLabel}</span>
                </div>
              </div>

              <div className="border border-zinc-300 rounded-xl text-sm text-zinc-700 overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-zinc-200">
                  <div className="p-3">
                    <div className="text-[11px] font-semibold uppercase text-zinc-500">Start</div>
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="h-6 w-full bg-transparent text-zinc-900 outline-none"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] font-semibold uppercase text-zinc-500">End</div>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || new Date().toISOString().split("T")[0]}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="h-6 w-full bg-transparent text-zinc-900 outline-none"
                    />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between px-3 py-3 border-t border-zinc-200">
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-zinc-500">Guests</div>
                    <div className="text-zinc-900">{guests} guest{guests > 1 ? "s" : ""}</div>
                  </div>
                  <input
                    type="number"
                    value={guests}
                    min={1}
                    max={Math.max(1, experience.maxGuests || 1)}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      if (Number.isNaN(value)) return
                      setGuests(Math.min(Math.max(value, 1), Math.max(1, experience.maxGuests || 1)))
                    }}
                    className="h-9 w-20 rounded-lg border border-zinc-300 px-2 text-zinc-900"
                  />
                </div>
              </div>

              {isSelectedDateBookedByOthers && (
                <p className="text-sm text-red-600">These dates are already booked by another guest. Please choose another range.</p>
              )}
              {(hasExistingBookingByCurrentUser || isSelectedDateReservedByCurrentUser) && (
                <p className="text-sm text-[#FF5A1F]">You already booked this experience.</p>
              )}
              {isSelectedDateOutsideAvailability && (
                <p className="text-sm text-red-600">Selected dates are outside the host&apos;s available schedule.</p>
              )}

              {isHostViewing ? (
                <button type="button" disabled className="w-full rounded-xl py-3.5 font-semibold text-sm bg-zinc-300 text-zinc-700 cursor-not-allowed">
                  Your Experience
                </button>
              ) : reservationStatus === "success" || hasExistingBookingByCurrentUser || isSelectedDateReservedByCurrentUser ? (
                <button type="button" disabled className="w-full rounded-xl py-3.5 font-semibold text-sm bg-[#FF5A1F]/70 text-white cursor-not-allowed">
                  Booked
                </button>
              ) : !startDate || !endDate ? (
                <button type="button" disabled className="w-full rounded-xl py-3.5 font-semibold text-sm bg-zinc-300 text-zinc-700 cursor-not-allowed">
                  Select dates to book
                </button>
              ) : isSelectedDateBookedByOthers ? (
                <button type="button" disabled className="w-full rounded-xl py-3.5 font-semibold text-sm bg-red-300 text-red-900 cursor-not-allowed">
                  Booked for selected dates
                </button>
              ) : isSelectedDateOutsideAvailability ? (
                <button type="button" disabled className="w-full rounded-xl py-3.5 font-semibold text-sm bg-red-300 text-red-900 cursor-not-allowed">
                  Not available
                </button>
              ) : (
                <Link
                  href={reserveHref}
                  className="block w-full bg-[#FF5A1F] text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-[#e44e1a] shadow-md shadow-orange-200 text-center"
                >
                  Book experience
                </Link>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
