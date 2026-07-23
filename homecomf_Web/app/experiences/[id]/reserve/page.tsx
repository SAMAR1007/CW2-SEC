"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Star } from "lucide-react"
import { verify } from "@/lib/api/auth"
import { getActiveBookingsForListing, getBookings, getPublicExperienceById, initiateEsewaPayment, cancelPendingBooking } from "@/lib/api/listings"

interface Experience {
  _id: string
  title: string
  location: string
  price: number
  images: string[]
  availableDates?: Array<string | Date>
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

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function ReserveExperiencePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [experience, setExperience] = useState<Experience | null>(null)
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
          getPublicExperienceById(params.id as string),
          getBookings().catch(() => []),
          verify().catch(() => null),
          getActiveBookingsForListing(params.id as string, 'experience').catch(() => []),
        ])
        setExperience(res.data)
        const userBookings = Array.isArray(bookingRes) ? bookingRes : []
        const allBookings = Array.isArray(listingBookingsRes) ? listingBookingsRes : []
        const userBookingIds = new Set(userBookings.map((b: any) => b._id))
        setBookings([...userBookings, ...allBookings.filter((b: any) => !userBookingIds.has(b._id))])
        setCurrentUserId(authRes?.user?._id ? String(authRes.user._id) : "")
      } catch (err) {
        console.error("Failed to load experience", err)
        setError("Unable to load checkout details right now.")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      load()
    }
  }, [params.id])

  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const guests = Number(searchParams.get("guests") || "1")

  const days = useMemo(() => {
    if (!startDate || !endDate) return 1
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end.getTime() - start.getTime()
    if (Number.isNaN(diffMs) || diffMs <= 0) return 1
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }, [startDate, endDate])

  const pricing = useMemo(() => {
    if (!experience) {
      return {
        days,
        subtotal: 0,
        discount: 0,
        total: 0,
      }
    }

    const subtotal = experience.price * Math.max(1, guests) * days
    const discount = Number((subtotal * 0.05).toFixed(2))
    const total = Number((subtotal - discount).toFixed(2))

    return { days, subtotal, discount, total }
  }, [experience, guests, days])

  const availableDateKeys = useMemo(() => {
    if (!experience?.availableDates?.length) return new Set<string>()
    return new Set(
      experience.availableDates
        .map((date) => new Date(date))
        .filter((date) => !Number.isNaN(date.getTime()))
        .map((date) => toDateKey(date)),
    )
  }, [experience?.availableDates])

  const isOutsideAvailability = useMemo(() => {
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

  const overlapState = useMemo(() => {
    if (!experience?._id || !startDate || !endDate) {
      return { reservedByCurrentUser: false, bookedByOthers: false }
    }

    const selectedStart = new Date(startDate)
    const selectedEnd = new Date(endDate)
    if (Number.isNaN(selectedStart.getTime()) || Number.isNaN(selectedEnd.getTime()) || selectedEnd <= selectedStart) {
      return { reservedByCurrentUser: false, bookedByOthers: false }
    }

    let reservedByCurrentUser = false
    let bookedByOthers = false

    bookings.forEach((booking) => {
      const bookingExperienceId = normalizeId(booking.experienceId)
      const bookingUserId = normalizeId(booking.userId)
      const active = booking.status === "pending" || booking.status === "confirmed"
      if (!active || bookingExperienceId !== experience._id) return

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
  }, [bookings, currentUserId, endDate, experience?._id, startDate])

  const handleContinueToEsewa = async () => {
    if (!startDate || !endDate) {
      setError("Please select start and end dates first.")
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

    if (!experience?._id) {
      setError("Experience data is not loaded. Please try again.")
      return
    }

    if (isOutsideAvailability) {
      setError("Selected dates are outside the host's available schedule.")
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

      const payload = {
        experienceId: experience._id,
        startDate,
        endDate,
      }

      console.log('💳 Frontend sending payment payload:', payload)

      const initiateResponse = await initiateEsewaPayment(payload)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-600">Loading payment details...</p>
      </div>
    )
  }

  if (error && !experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 text-center">
        <p className="text-zinc-600">{error || "Experience not found."}</p>
      </div>
    )
  }

  if (!experience) return null

  const coverImage = getImageUrl(experience.images?.[0])

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/experiences/${experience._id}`}
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
              {isOutsideAvailability && (
                <p className="text-sm text-red-600">Selected dates are outside the host&apos;s available schedule.</p>
              )}
              <button
                onClick={handleContinueToEsewa}
                disabled={processingPayment || overlapState.reservedByCurrentUser || overlapState.bookedByOthers || isOutsideAvailability}
                className="w-full bg-[#FF5A1F] text-white rounded-xl h-14 text-2xl font-semibold hover:bg-[#e44e1a] transition-colors disabled:opacity-60"
              >
                {processingPayment
                  ? "Processing..."
                  : overlapState.reservedByCurrentUser
                    ? "Booked"
                    : overlapState.bookedByOthers
                      ? "Booked"
                      : isOutsideAvailability
                        ? "Not available"
                        : "Continue to eSewa"}
              </button>
            </section>
          </div>

          <aside className="rounded-3xl border border-zinc-200 bg-white p-6 space-y-5">
            <div className="flex gap-4">
              <div className="relative w-28 h-24 overflow-hidden rounded-xl border border-zinc-200 shrink-0">
                <img
                  src={coverImage}
                  alt={experience.title}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = "/images/logo.png"
                  }}
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 leading-tight">{experience.title}</h3>
                <div className="flex items-center gap-1 text-zinc-700 mt-2 text-sm">
                  <Star className="w-4 h-4 fill-[#FF5A1F] text-[#FF5A1F]" />
                  <span>4.9</span>
                  <span>(35)</span>
                  <span>· Guest favorite</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-2xl font-semibold text-zinc-900">Dates</h4>
                <p className="text-zinc-700 text-lg mt-1">
                  {startDate && endDate ? `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}` : "Add your dates"}
                </p>
              </div>
              <Link href={`/experiences/${experience._id}`} className="bg-zinc-100 hover:bg-zinc-200 rounded-xl px-5 py-2 font-medium text-zinc-700">
                Change
              </Link>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-2xl font-semibold text-zinc-900">Guests</h4>
                <p className="text-zinc-700 text-lg mt-1">{Math.max(1, guests)} adult{Math.max(1, guests) > 1 ? "s" : ""}</p>
              </div>
              <Link href={`/experiences/${experience._id}`} className="bg-zinc-100 hover:bg-zinc-200 rounded-xl px-5 py-2 font-medium text-zinc-700">
                Change
              </Link>
            </div>

            <div className="pt-4 border-t border-zinc-200 space-y-2 text-sm text-zinc-700">
              <div className="flex justify-between">
                <span>{formatCurrency(experience.price)} × {Math.max(1, guests)} guests × {pricing.days} day{pricing.days > 1 ? "s" : ""}</span>
                <span>{formatCurrency(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Longer trip discount</span>
                <span>-{formatCurrency(pricing.discount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-zinc-900 pt-2 border-t border-zinc-200 mt-2 text-base">
                <span>Total</span>
                <span>{formatCurrency(pricing.total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
