"use client"

import { useEffect, useMemo, useState } from "react"
import { verify } from "@/lib/api/auth"
import { getHostReservations, getMyExperiences, getMyListings } from "@/lib/api/host"
import { listConversations } from "@/lib/api/messages"

type HostOverviewPageProps = {
  onNavigate: (page: string) => void
}

export default function HostOverviewPage({ onNavigate }: HostOverviewPageProps) {
  const [loading, setLoading] = useState(true)
  const [hostName, setHostName] = useState("Host")
  const [reservations, setReservations] = useState<any[]>([])
  const [stats, setStats] = useState({
    listings: 0,
    experiences: 0,
    reservationsToday: 0,
    upcomingReservations: 0,
    pendingRequests: 0,
    unreadMessages: 0,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [authRes, listingsRes, experiencesRes, reservationsRes, conversationsRes] = await Promise.all([
          verify().catch(() => ({})),
          getMyListings().catch(() => ({ listings: [] })),
          getMyExperiences().catch(() => ({ experiences: [] })),
          getHostReservations().catch(() => ({ reservations: [] })),
          listConversations("host").catch(() => []),
        ])

        const allReservations = Array.isArray((reservationsRes as any)?.reservations) ? (reservationsRes as any).reservations : []
        const conversations = Array.isArray(conversationsRes) ? conversationsRes : []

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const reservationsToday = allReservations.filter((reservation: any) => {
          const start = new Date(reservation?.startDate)
          const end = new Date(reservation?.endDate)
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
          start.setHours(0, 0, 0, 0)
          end.setHours(0, 0, 0, 0)
          return start.getTime() <= today.getTime() && end.getTime() >= today.getTime()
        }).length

        const upcomingReservations = allReservations.filter((reservation: any) => {
          const start = new Date(reservation?.startDate)
          if (Number.isNaN(start.getTime())) return false
          start.setHours(0, 0, 0, 0)
          return start.getTime() > today.getTime()
        }).length

        const pendingRequests = allReservations.filter((reservation: any) => String(reservation?.status || "").toLowerCase() === "pending").length

        const unreadMessages = conversations.reduce((sum: number, item: any) => sum + Number(item?.unreadCount || 0), 0)

        setHostName((authRes as any)?.user?.name ? String((authRes as any).user.name) : "Host")
        setReservations(allReservations)
        setStats({
          listings: Array.isArray((listingsRes as any)?.listings) ? (listingsRes as any).listings.length : 0,
          experiences: Array.isArray((experiencesRes as any)?.experiences) ? (experiencesRes as any).experiences.length : 0,
          reservationsToday,
          upcomingReservations,
          pendingRequests,
          unreadMessages,
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const nextReservations = useMemo(() => {
    const sorted = [...reservations].sort((a, b) => {
      const aTime = new Date(a?.startDate).getTime()
      const bTime = new Date(b?.startDate).getTime()
      return aTime - bTime
    })
    return sorted.slice(0, 5)
  }, [reservations])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading host dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">Host Dashboard</h1>
          <p className="text-zinc-600 mt-1">Welcome back, {hostName}. Here&apos;s your hosting summary.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
          <div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-500">Listings</p><p className="text-2xl font-bold text-zinc-900">{stats.listings}</p></div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-500">Experiences</p><p className="text-2xl font-bold text-zinc-900">{stats.experiences}</p></div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-500">Today</p><p className="text-2xl font-bold text-zinc-900">{stats.reservationsToday}</p></div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-500">Upcoming</p><p className="text-2xl font-bold text-zinc-900">{stats.upcomingReservations}</p></div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-500">Pending</p><p className="text-2xl font-bold text-zinc-900">{stats.pendingRequests}</p></div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-sm text-zinc-500">Unread messages</p><p className="text-2xl font-bold text-zinc-900">{stats.unreadMessages}</p></div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onNavigate("hostDashboard")} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50">Open Today</button>
            <button onClick={() => onNavigate("hostCalendar")} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50">Open Calendar</button>
            <button onClick={() => onNavigate("hostListings")} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50">Manage listings</button>
            <button onClick={() => onNavigate("hostMessages")} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50">Check messages</button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Next reservations</h2>
          {nextReservations.length === 0 ? (
            <p className="text-zinc-500">No reservations yet.</p>
          ) : (
            <div className="space-y-3">
              {nextReservations.map((reservation: any) => {
                const isStay = Boolean(reservation?.accommodationId)
                const title = isStay ? reservation?.accommodationId?.title : reservation?.experienceId?.title
                const guestName = reservation?.userId?.name || "Guest"
                return (
                  <div key={reservation?._id} className="rounded-xl border border-zinc-200 p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-[#FF5A1F]">{isStay ? "Stay" : "Experience"}</p>
                      <p className="font-semibold text-zinc-900">{title || "Reservation"}</p>
                      <p className="text-sm text-zinc-600">Guest: {guestName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-700 capitalize">{reservation?.status || "pending"}</p>
                      <p className="text-sm text-zinc-500">{new Date(reservation?.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
