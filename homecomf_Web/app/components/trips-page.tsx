"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Calendar, MapPin } from "lucide-react"
import { verify } from "@/lib/api/auth"
import { cancelBooking, getBookings, getPublicListings, getPublicExperiences } from "@/lib/api/listings"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/images/logo.png"
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

const statusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return { bg: "bg-green-100", text: "text-green-700", label: "Confirmed" }
    case "pending":
      return { bg: "bg-orange-100", text: "text-orange-700", label: "Pending" }
    case "cancelled":
      return { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" }
    case "completed":
      return { bg: "bg-blue-100", text: "text-blue-700", label: "Completed" }
    default:
      return { bg: "bg-zinc-100", text: "text-zinc-700", label: status }
  }
}

type TripCard = {
  bookingId: string
  listingId: string
  title: string
  location: string
  startDate: string
  endDate: string
  status: string
  image: string
  totalPrice: number
  type: "stay" | "experience"
}

export default function TripsPage() {
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<TripCard[]>([])
  const [activeTab, setActiveTab] = useState<"stays" | "experiences">("stays")
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [authRes, bookingRows, publicRes, experiencesRes] = await Promise.all([
          verify(),
          getBookings(),
          getPublicListings(),
          getPublicExperiences(),
        ])

        const currentUserId = authRes?.user?._id

        // Build accommodation lookup
        const listings = Array.isArray(publicRes?.data) ? publicRes.data : []
        const listingMap = new Map(
          listings.map((item: any) => [
            item._id,
            {
              title: item.title,
              location: item.location,
              image: getImageUrl(item.images?.[0]),
            },
          ]),
        )

        // Build experience lookup
        const experiences = Array.isArray(experiencesRes?.data) ? experiencesRes.data : []
        const experienceMap = new Map(
          experiences.map((item: any) => [
            item._id,
            {
              title: item.title,
              location: item.location,
              image: getImageUrl(item.images?.[0]),
            },
          ]),
        )

        const mapped: TripCard[] = (bookingRows as any[])
          .filter((booking) => {
            const bookingUserId = typeof booking.userId === "string" ? booking.userId : booking.userId?._id
            return bookingUserId === currentUserId
          })
          .map((booking) => {
            const accommodationId = typeof booking.accommodationId === "string"
              ? booking.accommodationId
              : booking.accommodationId?._id

            const experienceId = typeof booking.experienceId === "string"
              ? booking.experienceId
              : booking.experienceId?._id

            const isExperience = !!experienceId && !accommodationId
            const itemId = isExperience ? experienceId : accommodationId
            const itemData = isExperience
              ? experienceMap.get(itemId)
              : listingMap.get(itemId)

            return {
              bookingId: booking._id,
              listingId: itemId || "",
              title: itemData?.title || (isExperience ? booking?.experienceId?.title : booking?.accommodationId?.title) || (isExperience ? "Experience" : "Stay"),
              location: itemData?.location || "Nepal",
              startDate: booking.startDate,
              endDate: booking.endDate,
              status: booking.status || "pending",
              image: itemData?.image || "/images/logo.png",
              totalPrice: booking.totalPrice || 0,
              type: isExperience ? "experience" as const : "stay" as const,
            }
          })
          .filter((item) => item.listingId)

        setTrips(mapped)
      } catch (error) {
        console.error("Failed to load trips", error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredTrips = useMemo(
    () => trips.filter((trip) => (activeTab === "stays" ? trip.type === "stay" : trip.type === "experience")),
    [trips, activeTab],
  )

  const now = new Date()
  const upcomingTrips = useMemo(
    () => filteredTrips.filter((trip) => new Date(trip.endDate) >= now && trip.status !== "cancelled"),
    [filteredTrips, now],
  )
  const pastTrips = useMemo(
    () => filteredTrips.filter((trip) => new Date(trip.endDate) < now || trip.status === "cancelled"),
    [filteredTrips, now],
  )

  const tripLink = (trip: TripCard) =>
    trip.type === "experience" ? `/experiences/${trip.listingId}` : `/stays/${trip.listingId}`

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingBookingId(bookingId)
      await cancelBooking(bookingId)
      setTrips((previous) =>
        previous.map((trip) =>
          trip.bookingId === bookingId ? { ...trip, status: "cancelled" } : trip,
        ),
      )
    } catch (error) {
      console.error("Failed to cancel booking", error)
      alert("Failed to cancel booking")
    } finally {
      setCancellingBookingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-zinc-200 rounded-full mb-4"></div>
          <div className="text-zinc-400 font-semibold tracking-tight">Loading your trips...</div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10 md:py-16">
        <div className="mb-10 block">
          <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-3">Trips</h1>
          <p className="text-lg text-zinc-500 font-medium tracking-tight">Upcoming and past reservations</p>
        </div>

        {/* Toggle */}
        <div className="flex gap-3 mb-12">
          <button
            onClick={() => setActiveTab("stays")}
            className={`px-6 py-2.5 rounded-full text-sm font-extrabold transition-all duration-300 ${
              activeTab === "stays"
                ? "bg-[#FF5A1F] text-white shadow-[0_4px_14px_rgba(255,90,31,0.3)] hover:bg-[#e44e1a] scale-100"
                : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 shadow-sm opacity-90 hover:opacity-100 scale-95 hover:scale-100"
            }`}
          >
            Stays
          </button>
          <button
            onClick={() => setActiveTab("experiences")}
            className={`px-6 py-2.5 rounded-full text-sm font-extrabold transition-all duration-300 ${
              activeTab === "experiences"
                ? "bg-[#FF5A1F] text-white shadow-[0_4px_14px_rgba(255,90,31,0.3)] hover:bg-[#e44e1a] scale-100"
                : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 shadow-sm opacity-90 hover:opacity-100 scale-95 hover:scale-100"
            }`}
          >
            Experiences
          </button>
        </div>

        {/* Upcoming Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-6 flex items-center gap-3">
            <span className="bg-green-100 text-green-700 p-2 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            Upcoming
          </h2>
          {upcomingTrips.length === 0 ? (
            <div className="rounded-[2rem] border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center transition-all hover:bg-zinc-50">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-zinc-100">
                <MapPin className="w-6 h-6 text-zinc-300" />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900 mb-2">No upcoming {activeTab === "stays" ? "stays" : "experiences"} yet</h3>
              <p className="text-zinc-500 font-medium max-w-sm mx-auto">Time to dust off your bags and start planning your next adventure.</p>
              <Link 
                href={activeTab === "stays" ? "/stays" : "/experiences"}
                className="inline-block mt-6 px-6 py-3 bg-zinc-900 text-white font-bold rounded-full hover:bg-zinc-800 transition-colors"
              >
                Start exploring
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {upcomingTrips.map((trip) => {
                const isCancelling = cancellingBookingId === trip.bookingId
                const canCancel = trip.status !== "cancelled" && trip.status !== "completed" && new Date(trip.endDate) >= now
                const statusMeta = statusBadge(trip.status)
                
                return (
                  <div key={trip.bookingId} className="group bg-white rounded-[1.5rem] overflow-hidden border border-zinc-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 relative flex flex-col">
                    <Link href={tripLink(trip)} className="block relative aspect-[4/3] overflow-hidden bg-zinc-100">
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        onError={(event) => {
                          event.currentTarget.src = "/images/logo.png"
                        }}
                      />
                      <div className="absolute top-4 left-4">
                         <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-md bg-white/90 ${statusMeta.text}`}>
                           {statusMeta.label}
                         </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-[17px] font-extrabold text-zinc-900 tracking-tight line-clamp-1 mb-2 group-hover:text-[#FF5A1F] transition-colors">{trip.title}</h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2.5 text-sm font-medium text-zinc-500">
                          <MapPin className="w-4 h-4 text-zinc-400" />
                          <span className="truncate">{trip.location}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm font-medium text-zinc-500">
                          <Calendar className="w-4 h-4 text-zinc-400" />
                          <span>{new Date(trip.startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})} - {new Date(trip.endDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-zinc-100 mt-auto flex items-end justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-0.5">Total</span>
                          <p className="text-lg font-extrabold text-zinc-900 tracking-tight">Rs. {trip.totalPrice}</p>
                        </div>
                        {canCancel && (
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelBooking(trip.bookingId); }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            {isCancelling ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Past Section */}
        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-6 flex items-center gap-3">
            <span className="bg-zinc-100 text-zinc-600 p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            Where you've been
          </h2>
          {pastTrips.length === 0 ? (
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-12 text-center shadow-sm">
              <h3 className="text-lg font-extrabold text-zinc-900 mb-1">No past {activeTab === "stays" ? "stays" : "experiences"}</h3>
              <p className="text-zinc-500 font-medium">Your past trips will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {pastTrips.map((trip) => {
                const statusMeta = statusBadge(trip.status)
                return (
                  <Link key={trip.bookingId} href={tripLink(trip)} className="group bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col grayscale hover:grayscale-0">
                    <div className="relative h-40 overflow-hidden bg-zinc-100">
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(event) => {
                          event.currentTarget.src = "/images/logo.png"
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors"></div>
                      <div className="absolute top-3 left-3">
                         <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md bg-white/90 shadow-sm ${statusMeta.text}`}>
                           {statusMeta.label}
                         </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-zinc-900 tracking-tight line-clamp-1 mb-1">{trip.title}</h3>
                      <div className="text-xs font-semibold text-zinc-500 mb-2">
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
