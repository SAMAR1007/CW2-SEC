"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Star } from "lucide-react"
import { verify } from "@/lib/api/auth"
import { getActiveBookingsForListing, getBookings, getPublicListingById, initiateEsewaPayment, cancelPendingBooking } from "@/lib/api/listings"

interface Listing {
  _id: string
  title: string
  location: string
  price: number
  images: string[]
}

interface Booking {
  _id?: string
  userId?: string | { _id?: string }
  accommodationId?: string | { _id?: string }
  startDate: string
  endDate: string
  status?: "pending" | "confirmed" | "cancelled" | "completed"
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/placeholder.svg"
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

const formatDateLabel = (dateString: string | null) => {
  if (!dateString) return "Add date"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "Add date"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 2,
  }).format(amount)

export default function ReservePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [currentUserId, setCurrentUserId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    // Cancel any stale pending booking from a previous abandoned payment attempt
    const staleBookingId = sessionStorage.getItem('pendingBookingId')
    if (staleBookingId) {
      cancelPendingBooking(staleBookingId).catch(() => {})
      sessionStorage.removeItem('pendingBookingId')
    }

    const load = async () => {
      try {
        const [res, bookingRes, authRes, listingBookingsRes] = await Promise.all([
          getPublicListingById(params.id as string),
          getBookings().catch(() => []),
          verify().catch(() => null),
          getActiveBookingsForListing(params.id as string, 'accommodation').catch(() => []),
        ])
        setListing(res.data)
        const userBookings = Array.isArray(bookingRes) ? bookingRes : []
        const allBookings = Array.isArray(listingBookingsRes) ? listingBookingsRes : []
        const userBookingIds = new Set(userBookings.map((b: any) => b._id))
        setBookings([...userBookings, ...allBookings.filter((b: any) => !userBookingIds.has(b._id))])
        setCurrentUserId(authRes?.user?._id ? String(authRes.user._id) : "")
      } catch (err) {
        console.error("Failed to load listing", err)
        setError("Unable to load checkout details right now.")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      load()
    }
  }, [params.id])

  const checkIn = searchParams.get("checkIn")
  const checkOut = searchParams.get("checkOut")
  const guests = Number(searchParams.get("guests") || "1")

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 2
    const inDate = new Date(checkIn)
    const outDate = new Date(checkOut)
    const diffMs = outDate.getTime() - inDate.getTime()
    if (Number.isNaN(diffMs) || diffMs <= 0) return 1
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }, [checkIn, checkOut])

  const pricing = useMemo(() => {
    if (!listing) {
      return {
        nights,
        subtotal: 0,
        discount: 0,
        total: 0,
      }
    }

    const subtotal = listing.price * nights
    const discount = Number((subtotal * 0.075).toFixed(2))
    const total = Number((subtotal - discount).toFixed(2))

    return { nights, subtotal, discount, total }
  }, [listing, nights])

  const overlapState = useMemo(() => {
    if (!listing?._id || !checkIn || !checkOut) {
      return { reservedByCurrentUser: false, bookedByOthers: false }
    }

    const selectedStart = new Date(checkIn)
    const selectedEnd = new Date(checkOut)
    if (Number.isNaN(selectedStart.getTime()) || Number.isNaN(selectedEnd.getTime()) || selectedEnd <= selectedStart) {
      return { reservedByCurrentUser: false, bookedByOthers: false }
    }

    let reservedByCurrentUser = false
    let bookedByOthers = false

    bookings.forEach((booking) => {
      const bookingAccommodationId = normalizeId(booking.accommodationId)
      const bookingUserId = normalizeId(booking.userId)
      const active = booking.status === "pending" || booking.status === "confirmed"
      if (!active || bookingAccommodationId !== listing._id) return

      const bookingStart = new Date(booking.startDate)
      const bookingEnd = new Date(booking.endDate)
      if (Number.isNaN(bookingStart.getTime()) || Number.isNaN(bookingEnd.getTime())) return
      if (!hasDateOverlap(selectedStart, selectedEnd, bookingStart, bookingEnd)) return

      if (currentUserId && bookingUserId === currentUserId) {
        reservedByCurrentUser = true
      } else {
        bookedByOthers = true
      }
    })

    return { reservedByCurrentUser, bookedByOthers }
  }, [bookings, checkIn, checkOut, currentUserId, listing?._id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-600">Loading payment details...</p>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 text-center">
        <p className="text-zinc-600">{error || "Listing not found."}</p>
      </div>
    )
  }

  const coverImage = getImageUrl(listing.images?.[0])

  const handleContinueToEsewa = async () => {
    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates first.")
      return
    }

    if (overlapState.reservedByCurrentUser) {
      setError("You have already booked these dates.")
      return
    }

    if (overlapState.bookedByOthers) {
      setError("These dates are already booked. Please choose different dates.")
      return
    }

    try {
      setProcessingPayment(true)
      setError(null)

      const authData = await verify()
      const userId = authData?.user?._id
      if (!userId) {
        setError("Please login to complete your reservation.")
        router.push("/auth/login")
        return
      }

      const initiateResponse = await initiateEsewaPayment({
        accommodationId: listing._id,
        startDate: checkIn,
        endDate: checkOut,
      })

      const paymentUrl = initiateResponse?.data?.paymentUrl as string | undefined
      const formFields = initiateResponse?.data?.formFields as Record<string, string> | undefined
      const bookingId = initiateResponse?.data?.bookingId as string | undefined

      if (!paymentUrl || !formFields) {
        // Cancel the pending booking since we can't proceed
        if (bookingId) cancelPendingBooking(bookingId).catch(() => {})
        setError("Unable to initialize eSewa checkout.")
        return
      }

      // Store bookingId so we can cancel if user navigates away before completing payment
      if (bookingId) {
        sessionStorage.setItem('pendingBookingId', bookingId)
      }

      const form = document.createElement("form")
      form.method = "POST"
      form.action = paymentUrl

      Object.entries(formFields).forEach(([key, value]) => {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = key
        input.value = String(value)
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
    } catch (paymentError: any) {
      if (paymentError?.response?.status === 401) {
        router.push("/auth/login")
      }
      setError(paymentError?.response?.data?.message || "Unable to continue to eSewa right now.")
    } finally {
      setProcessingPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/stays/${listing._id}`}
            className="w-11 h-11 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-700" />
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-900">Confirm and pay</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-10 items-start">
          <div>
            <section className="pb-6 border-b border-zinc-200">
              <h2 className="text-3xl font-semibold text-zinc-900 mb-2">Proceed to payment</h2>
              <p className="text-zinc-700 text-xl">You&apos;ll be directed to eSewa to complete your payment details.</p>
            </section>

            <section className="pt-6 space-y-6">
              {error && <p className="text-sm text-red-600">{error}</p>}
              {overlapState.reservedByCurrentUser && (
                <p className="text-sm text-[#FF5A1F]">You already booked these dates.</p>
              )}
              {overlapState.bookedByOthers && (
                <p className="text-sm text-red-600">Selected dates are booked by another guest.</p>
              )}
              <p className="text-base text-zinc-700 leading-relaxed border-t border-zinc-200 pt-6">
                By selecting the button, I agree to the
                <a href="#" className="underline font-medium ml-1">booking terms</a>
                <span> and </span>
                <a href="#" className="underline font-medium">updated Terms of Service</a>
                <span>. View </span>
                <a href="#" className="underline font-medium">Privacy Policy</a>.
              </p>

              <button
                onClick={handleContinueToEsewa}
                disabled={processingPayment || overlapState.reservedByCurrentUser || overlapState.bookedByOthers}
                className="w-full bg-[#FF5A1F] text-white rounded-xl h-14 text-2xl font-semibold hover:bg-[#e44e1a] transition-colors disabled:opacity-60"
              >
                {processingPayment
                  ? "Processing..."
                  : overlapState.reservedByCurrentUser
                    ? "Booked"
                    : overlapState.bookedByOthers
                      ? "Booked"
                      : "Continue to eSewa"}
              </button>
            </section>
          </div>

          <aside className="rounded-3xl border border-zinc-200 bg-white p-6 space-y-5">
            <div className="flex gap-4">
              <div className="relative w-28 h-24 overflow-hidden rounded-xl border border-zinc-200 shrink-0">
                <img
                  src={coverImage}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = "/images/logo.png"
                  }}
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 leading-tight">{listing.title}</h3>
                <div className="flex items-center gap-1 text-zinc-700 mt-2 text-sm">
                  <Star className="w-4 h-4 fill-[#FF5A1F] text-[#FF5A1F]" />
                  <span>4.9</span>
                  <span>(35)</span>
                  <span>· Guest favorite</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200">
              <h4 className="text-2xl font-semibold text-zinc-900">Free cancellation</h4>
              <p className="text-zinc-700 mt-1 text-lg">
                Cancel before April 2 for a full refund. <a href="#" className="underline font-medium">Full policy</a>
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-2xl font-semibold text-zinc-900">Dates</h4>
                <p className="text-zinc-700 text-lg mt-1">
                  {checkIn && checkOut ? `${formatDateLabel(checkIn)} – ${formatDateLabel(checkOut)}` : "Add your dates"}
                </p>
              </div>
              <Link href={`/stays/${listing._id}`} className="bg-zinc-100 hover:bg-zinc-200 rounded-xl px-5 py-2 font-medium text-zinc-700">
                Change
              </Link>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-2xl font-semibold text-zinc-900">Guests</h4>
                <p className="text-zinc-700 text-lg mt-1">{Math.max(1, guests)} adult{Math.max(1, guests) > 1 ? "s" : ""}</p>
              </div>
              <Link href={`/stays/${listing._id}`} className="bg-zinc-100 hover:bg-zinc-200 rounded-xl px-5 py-2 font-medium text-zinc-700">
                Change
              </Link>
            </div>

            <div className="pt-4 border-t border-zinc-200">
              <h4 className="text-2xl font-semibold text-zinc-900 mb-3">Price details</h4>
              <div className="space-y-2 text-lg text-zinc-700">
                <div className="flex justify-between">
                  <span>{pricing.nights} nights x {formatCurrency(listing.price)}</span>
                  <span>{formatCurrency(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Early bird discount</span>
                  <span>-{formatCurrency(pricing.discount)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex items-center justify-between text-2xl font-semibold text-zinc-900">
              <span>Total NPR</span>
              <span>{formatCurrency(pricing.total)}</span>
            </div>

            <a href="#" className="underline text-zinc-700 font-medium inline-block">Price breakdown</a>
          </aside>
        </div>
      </div>
    </div>
  )
}
