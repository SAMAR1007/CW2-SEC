"use client"

import { useEffect, useState } from "react"
import { BookOpen } from "lucide-react"
import { getHostReservations } from "@/lib/api/host"
import Link from "next/link"

interface HostDashboardPageProps {
  onNavigate: (page: string) => void
}

type HostTab = "today" | "upcoming"
type ReservationKind = "stay" | "experience"

export default function HostDashboardPage({ onNavigate }: HostDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<HostTab>("today")
  const [activeReservationKind, setActiveReservationKind] = useState<ReservationKind>("stay")
  const [allReservations, setAllReservations] = useState<any[]>([])
  const [loadingReservations, setLoadingReservations] = useState(true)
  const [expandedReservationId, setExpandedReservationId] = useState<string | null>(null)

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const res = await getHostReservations()
        console.log("🔍 Host Reservations API Response:", res)
        const items = Array.isArray(res?.reservations) ? res.reservations : []
        console.log("📋 Loaded reservations:", items)
        setAllReservations(items)
      } catch (error) {
        console.error("❌ Failed to load host reservations:", error)
        setAllReservations([])
      } finally {
        setLoadingReservations(false)
      }
    }

    loadReservations()
  }, [])

  const stayReservations = allReservations.filter((r) => r.accommodationId !== null && r.accommodationId !== undefined)
  const experienceReservations = allReservations.filter((r) => r.experienceId !== null && r.experienceId !== undefined)

  const filteredStayReservations = stayReservations.filter((reservation) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(reservation.startDate)
    startDate.setHours(0, 0, 0, 0)
    
    if (activeTab === "today") {
      const endDate = new Date(reservation.endDate)
      endDate.setHours(0, 0, 0, 0)
      return startDate.getTime() === today.getTime() || (startDate.getTime() < today.getTime() && endDate.getTime() >= today.getTime())
    } else {
      return startDate.getTime() >= today.getTime()
    }
  })

  const filteredExperienceReservations = experienceReservations.filter((reservation) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(reservation.startDate)
    startDate.setHours(0, 0, 0, 0)
    
    if (activeTab === "today") {
      const endDate = new Date(reservation.endDate)
      endDate.setHours(0, 0, 0, 0)
      return startDate.getTime() === today.getTime() || (startDate.getTime() < today.getTime() && endDate.getTime() >= today.getTime())
    } else {
      return startDate.getTime() >= today.getTime()
    }
  })

  const getGuestCount = (reservation: any) => {
    const candidates = [
      reservation?.guestCount,
      reservation?.guests,
      reservation?.numberOfGuests,
      reservation?.totalGuests,
      reservation?.bookingDetails?.guestCount,
      reservation?.bookingDetails?.guests,
    ]

    for (const value of candidates) {
      const parsed = Number(value)
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed
      }
    }

    return 1
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab("today")}
            className={`rounded-full px-8 py-3 text-base font-semibold transition-colors ${
              activeTab === "today"
                ? "bg-[#FF5A1F] text-white"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-full px-8 py-3 text-base font-semibold transition-colors ${
              activeTab === "upcoming"
                ? "bg-[#FF5A1F] text-white"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            }`}
          >
            Upcoming
          </button>
        </div>

        <div className="flex justify-center gap-3 mb-16">
          <button
            onClick={() => setActiveReservationKind("stay")}
            className={`rounded-full px-8 py-3 text-base font-semibold transition-colors ${
              activeReservationKind === "stay"
                ? "bg-[#FF5A1F] text-white"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            }`}
          >
            Stays
          </button>
          <button
            onClick={() => setActiveReservationKind("experience")}
            className={`rounded-full px-8 py-3 text-base font-semibold transition-colors ${
              activeReservationKind === "experience"
                ? "bg-[#FF5A1F] text-white"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            }`}
          >
            Experiences
          </button>
        </div>

        {loadingReservations ? (
          <div className="text-center py-20 text-zinc-500">Loading reservations...</div>
        ) : allReservations.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-12">
            {activeReservationKind === "stay" ? (
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-6">Your stay reservations</h2>
                {filteredStayReservations.length > 0 ? (
                  <div className="space-y-4">
                    {filteredStayReservations.map((reservation) => {
                      const stay = reservation.accommodationId
                      const title = stay?.title || "Reservation"
                      const location = stay?.location || ""
                      const guestName = reservation.userId?.name || "Guest"
                      const guestEmail = reservation.userId?.email || ""
                      const guestCount = getGuestCount(reservation)
                      const arrivalDate = reservation.startDate ? new Date(reservation.startDate).toLocaleDateString() : "N/A"
                      const isExpanded = expandedReservationId === reservation._id
                      return (
                        <button
                          key={reservation._id}
                          type="button"
                          onClick={() => setExpandedReservationId(isExpanded ? null : reservation._id)}
                          className="w-full text-left bg-white border border-zinc-200 rounded-xl p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm text-[#FF5A1F] font-medium mb-1">Stay</p>
                              <h3 className="text-xl font-semibold text-zinc-900">{title}</h3>
                              <p className="text-zinc-600">{location}</p>
                              <p className="text-sm text-zinc-600 mt-2">Guest: {guestName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm capitalize font-medium text-zinc-700">{reservation.status}</p>
                              <p className="text-sm text-zinc-500">{new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-zinc-100 pt-4 text-sm text-zinc-700">
                              <p><span className="font-semibold text-zinc-900">Booked by:</span> {guestName}</p>
                              <p><span className="font-semibold text-zinc-900">Guest email:</span> {guestEmail || "N/A"}</p>
                              <p><span className="font-semibold text-zinc-900">Guests coming:</span> {guestCount}</p>
                              <p><span className="font-semibold text-zinc-900">Arrival date:</span> {arrivalDate}</p>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <p>No stay reservations {activeTab === 'today' ? 'today' : 'upcoming'}.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-6">Your experience reservations</h2>
                {filteredExperienceReservations.length > 0 ? (
                  <div className="space-y-4">
                    {filteredExperienceReservations.map((reservation) => {
                      const experience = reservation.experienceId
                      const title = experience?.title || "Reservation"
                      const location = experience?.location || ""
                      const guestName = reservation.userId?.name || "Guest"
                      const guestEmail = reservation.userId?.email || ""
                      const guestCount = getGuestCount(reservation)
                      const arrivalDate = reservation.startDate ? new Date(reservation.startDate).toLocaleDateString() : "N/A"
                      const isExpanded = expandedReservationId === reservation._id
                      return (
                        <button
                          key={reservation._id}
                          type="button"
                          onClick={() => setExpandedReservationId(isExpanded ? null : reservation._id)}
                          className="w-full text-left bg-white border border-zinc-200 rounded-xl p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm text-[#FF5A1F] font-medium mb-1">Experience</p>
                              <h3 className="text-xl font-semibold text-zinc-900">{title}</h3>
                              <p className="text-zinc-600">{location}</p>
                              <p className="text-sm text-zinc-600 mt-2">Guest: {guestName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm capitalize font-medium text-zinc-700">{reservation.status}</p>
                              <p className="text-sm text-zinc-500">{new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-zinc-100 pt-4 text-sm text-zinc-700">
                              <p><span className="font-semibold text-zinc-900">Booked by:</span> {guestName}</p>
                              <p><span className="font-semibold text-zinc-900">Guest email:</span> {guestEmail || "N/A"}</p>
                              <p><span className="font-semibold text-zinc-900">Guests coming:</span> {guestCount}</p>
                              <p><span className="font-semibold text-zinc-900">Arrival date:</span> {arrivalDate}</p>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <p>No experience reservations {activeTab === 'today' ? 'today' : 'upcoming'}.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
        <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto pt-4">
          <div className="mb-8 flex items-center justify-center">
            <div className="rounded-3xl bg-white p-10 border border-zinc-200">
              <BookOpen className="w-24 h-24 text-zinc-500" strokeWidth={1.2} />
            </div>
          </div>
          <h2 className="text-6xl leading-tight font-bold text-zinc-900 mb-4">You don&apos;t have any reservations</h2>
          <p className="text-3xl text-zinc-600 mb-10 max-w-md">
            To get booked, you&apos;ll need to complete and publish your listing.
          </p>
          <button
            onClick={() => {
              window.location.href = "/host/create"
            }}
            className="rounded-xl bg-zinc-200 text-zinc-900 px-8 py-3 text-sm font-semibold hover:bg-zinc-300 transition-colors"
          >
            Complete your listing
          </button>
        </div>
        )}
      </div>
    </div>
  )
}
