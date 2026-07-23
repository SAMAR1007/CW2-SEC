"use client"

import { useEffect, useState } from "react"
import { verify } from "@/lib/api/auth"
import { getBookings } from "@/lib/api/listings"
import { listConversations } from "@/lib/api/messages"
import { getWishlist } from "@/lib/api/wishlist"

type DashboardStats = {
  activeBookings: number
  newMessages: number
  savedPlaces: number
  totalBookings: number
  upcomingBookings: number
  pastBookings: number
  cancelledBookings: number
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("Traveler")
  const [stats, setStats] = useState<DashboardStats>({
    activeBookings: 0,
    newMessages: 0,
    savedPlaces: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    pastBookings: 0,
    cancelledBookings: 0,
  })
  const [recentConversations, setRecentConversations] = useState<any[]>([])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [authRes, bookingsRes, conversationsRes] = await Promise.all([
          verify(),
          getBookings().catch(() => []),
          listConversations("travelling").catch(() => []),
        ])

        const currentUserId = authRes?.user?._id ? String(authRes.user._id) : ""
        const userName = authRes?.user?.name ? String(authRes.user.name) : "Traveler"
        const bookings = Array.isArray(bookingsRes) ? bookingsRes : []
        const conversations = Array.isArray(conversationsRes) ? conversationsRes : []

        const today = new Date()
        const userBookings = bookings.filter((booking: any) => {
          const bookingUserId = typeof booking?.userId === "string" ? booking.userId : booking?.userId?._id
          return String(bookingUserId || "") === currentUserId
        })

        const activeBookings = userBookings.filter((booking: any) => {
          const endDate = new Date(booking?.endDate)
          const status = String(booking?.status || "pending").toLowerCase()
          if (Number.isNaN(endDate.getTime())) return false
          return endDate >= today && status !== "cancelled"
        }).length

        const upcomingBookings = userBookings.filter((booking: any) => {
          const startDate = new Date(booking?.startDate)
          const status = String(booking?.status || "pending").toLowerCase()
          if (Number.isNaN(startDate.getTime())) return false
          return startDate > today && status !== "cancelled"
        }).length

        const cancelledBookings = userBookings.filter(
          (booking: any) => String(booking?.status || "").toLowerCase() === "cancelled",
        ).length

        const pastBookings = Math.max(0, userBookings.length - upcomingBookings - cancelledBookings)

        const unreadMessages = conversations.reduce((sum: number, conversation: any) => {
          const unread = Number(conversation?.unreadCount || 0)
          return sum + (Number.isNaN(unread) ? 0 : unread)
        }, 0)

        let savedPlaces = 0
        try {
          const wishlistIds = await getWishlist()
          savedPlaces = wishlistIds.length
        } catch {
          savedPlaces = 0
        }

        setName(userName)
        setRecentConversations(conversations.slice(0, 4))
        setStats({
          activeBookings,
          newMessages: unreadMessages,
          savedPlaces,
          totalBookings: userBookings.length,
          upcomingBookings,
          pastBookings,
          cancelledBookings,
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500">Welcome back, {name}! Here&apos;s your trip overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-orange-50 text-[#FF5A1F]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Active Bookings</h3>
          <p className="text-3xl font-bold text-zinc-900">{String(stats.activeBookings).padStart(2, "0")}</p>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">New Messages</h3>
          <p className="text-3xl font-bold text-zinc-900">{String(stats.newMessages).padStart(2, "0")}</p>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Saved Places</h3>
          <p className="text-3xl font-bold text-zinc-900">{String(stats.savedPlaces).padStart(2, "0")}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Your account summary</h3>
        <p className="mt-2 text-zinc-600">Total reservations made: <span className="font-semibold text-zinc-900">{stats.totalBookings}</span></p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Booking breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-zinc-600">Upcoming bookings</span><span className="font-semibold text-zinc-900">{stats.upcomingBookings}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-zinc-600">Past bookings</span><span className="font-semibold text-zinc-900">{stats.pastBookings}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-zinc-600">Cancelled bookings</span><span className="font-semibold text-zinc-900">{stats.cancelledBookings}</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Recent conversations</h3>
          {recentConversations.length === 0 ? (
            <p className="text-sm text-zinc-500">No conversations yet.</p>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((conversation) => (
                <div
                  key={`${conversation?.counterpart?._id || "unknown"}-${conversation?.accommodationId || ""}-${conversation?.experienceId || ""}`}
                  className="rounded-xl border border-zinc-200 p-3"
                >
                  <p className="text-sm font-semibold text-zinc-900">{conversation?.counterpart?.name || "Host"}</p>
                  <p className="text-xs text-zinc-500 truncate">{conversation?.lastMessage || "No message preview"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
