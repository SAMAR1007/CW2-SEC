"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { handleLogout } from "@/lib/actions/auth-action"
import { verify } from "@/lib/api/auth"
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return ""
  const normalizedPath = imagePath.replace(/\\/g, "/")
  if (normalizedPath.startsWith("http://") || normalizedPath.startsWith("https://")) return normalizedPath
  return `${API_BASE_URL}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`
}

interface HostStatus {
  status: string
  rejectionReason: string | null
  isVerifiedHost: boolean
}

interface NavbarProps {
  onNavigate?: (page: any) => void
  isLoggedIn?: boolean
  hostStatus?: HostStatus | null
  currentPage?: string
  onHostStatusRefresh?: () => Promise<void>
}

interface AppNotification {
  _id: string
  type: string
  title: string
  message: string
  targetPage?: string
  isRead: boolean
  createdAt: string
}

export function Navbar({
  onNavigate,
  isLoggedIn: initialIsLoggedIn = false,
  hostStatus = null,
  currentPage = "explore",
  onHostStatusRefresh,
}: NavbarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn)
  const [user, setUser] = useState<any>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const isVerifiedHost = hostStatus?.isVerifiedHost === true
  const isHostPage = currentPage === "hostOverview" || currentPage === "hostDashboard" || currentPage === "hostMessages" || currentPage === "hostCalendar" || currentPage === "hostListings" || currentPage === "hostExperiences" || currentPage === "hostNotifications"
  const isHostContext = isHostPage || currentPage === "hostVerification"
  const isStayActive = currentPage === "explore" || currentPage === "stays" || currentPage === "map"
  const isExperienceActive = currentPage === "experiences"
  const navTabBaseClass = "inline-flex h-10 items-center pb-1 text-sm font-medium transition-colors"
  const hostNavTabBaseClass = "inline-flex h-10 items-center pb-1 text-sm font-medium transition-colors"
  const navTabActiveClass = "border-b-2 border-zinc-900 text-zinc-900"
  const navTabInactiveClass = "text-zinc-600 hover:text-zinc-900"

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await verify()
        setUser(res.user)
        setIsLoggedIn(true)
      } catch (error) {
        setUser(null)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return

    let isMounted = true
    const mode: 'host' | 'travelling' = isHostContext ? 'host' : 'travelling'

    const fetchNotifications = async () => {
      try {
        const data = await listNotifications(20, mode)
        if (!isMounted) return
        setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
        setUnreadCount(Number(data.unreadCount || 0))
      } catch {
      }
    }

    fetchNotifications()
    const interval = window.setInterval(fetchNotifications, 15000)

    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [isLoggedIn, isHostContext])

  const handleLogoutClick = async () => {
    try {
      await handleLogout()
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleNotificationClick = async (item: AppNotification) => {
    try {
      if (!item.isRead) {
        await markNotificationRead(item._id)
        setNotifications((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
    }

    if (item.targetPage) {
      const target = isHostContext && item.targetPage === 'notifications'
        ? 'hostNotifications'
        : item.targetPage
      onNavigate?.(target)
      setNotificationsOpen(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
      setUnreadCount(0)
    } catch {
    }
  }

  const formatRelativeTime = (dateLike?: string) => {
    if (!dateLike) return ''
    const time = new Date(dateLike).getTime()
    if (Number.isNaN(time)) return ''
    const diff = Date.now() - time
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const NotificationsButton = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setNotificationsOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FF5A1F] text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {notificationsOpen && (
        <div className="absolute right-0 mt-2 w-85 rounded-xl border border-zinc-100 bg-white shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Notifications</p>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-[#FF5A1F] hover:underline"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500">No notifications yet</p>
            ) : (
              notifications.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 ${item.isRead ? '' : 'bg-orange-50/50'}`}
                >
                  <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{item.message}</p>
                  <p className="text-[11px] text-zinc-400 mt-1">{formatRelativeTime(item.createdAt)}</p>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-zinc-100 p-2">
            <button
              type="button"
              onClick={() => {
                onNavigate?.(isHostContext ? "hostNotifications" : "notifications")
                setNotificationsOpen(false)
              }}
              className="w-full rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (isHostContext) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => onNavigate?.("hostDashboard")} className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="homecomf" width={120} height={120} className="rounded-lg" />
          </button>

          <div className="hidden md:flex items-center gap-6">
            <button 
              type="button"
              onClick={() => onNavigate?.("hostDashboard")}
              className={`${hostNavTabBaseClass} ${
                currentPage === "hostDashboard"
                  ? navTabActiveClass
                  : navTabInactiveClass
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("hostCalendar")}
              className={`${hostNavTabBaseClass} ${
                currentPage === "hostCalendar"
                  ? navTabActiveClass
                  : navTabInactiveClass
              }`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("hostListings")}
              className={`${hostNavTabBaseClass} ${
                currentPage === "hostListings" || currentPage === "hostExperiences"
                  ? navTabActiveClass
                  : navTabInactiveClass
              }`}
            >
              Listings
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("hostMessages")}
              className={`${hostNavTabBaseClass} ${
                currentPage === "hostMessages"
                  ? navTabActiveClass
                  : navTabInactiveClass
              }`}
            >
              Messages
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("hostVerification")}
              className={`${hostNavTabBaseClass} ${
                currentPage === "hostVerification"
                  ? navTabActiveClass
                  : navTabInactiveClass
              }`}
            >
              Verification
            </button>
          </div>

          <div className="flex items-center gap-4">
            <NotificationsButton />
            <button
              onClick={() => onNavigate?.("explore")}
              className="text-sm font-medium text-zinc-600 hover:text-black"
            >
              Switch to traveling
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 rounded-full border border-zinc-200 p-1 pl-3 hover:shadow-md transition-shadow">
                <div className="size-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-sm font-semibold overflow-hidden">
                  {user?.image ? (
                    <img
                      src={getImageUrl(user.image)}
                      alt={user?.name || "Profile"}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = "/images/logo.png"
                      }}
                    />
                  ) : (
                    user?.name?.[0]?.toUpperCase?.() || "U"
                  )}
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-700"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>

              <div className="absolute right-0 mt-2 w-56 scale-95 opacity-0 invisible group-hover:visible group-hover:opacity-100 group-hover:scale-100 origin-top-right rounded-xl border border-zinc-100 bg-white p-2 shadow-xl transition-all duration-200">
                <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Host</div>
                <button
                  onClick={() => onNavigate?.("hostOverview")}
                  className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate?.("hostNotifications")}
                  className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Notifications
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.("hostListings")}
                  className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Host a stay
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.("hostExperiences")}
                  className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Host an experience
                </button>
                <button
                  onClick={() => onNavigate?.("hostVerification")}
                  className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Verification
                </button>
                <div className="my-1 border-t border-zinc-100" />
                <button
                  onClick={() => onNavigate?.("explore")}
                  className="w-full text-left block rounded-lg px-3 py-2 text-sm text-[#FF5A1F] hover:bg-orange-50 font-medium"
                >
                  Switch to travelling
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 font-medium"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <button onClick={() => onNavigate?.("explore")} className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="homecomf"
              width={120}
              height={120}
              className="rounded-lg"
            />
          </button>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate?.("explore")}
              className={`${navTabBaseClass} ${
                isStayActive
                  ? navTabActiveClass
                  : navTabInactiveClass
              }`}
            >
              STAY
            </button>
            <button
              onClick={() => onNavigate?.("experiences")}
              className={`${navTabBaseClass} ${
                isExperienceActive
                  ? navTabActiveClass
                  : navTabInactiveClass
              }`}
            >
              EXPERIENCE
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn && <NotificationsButton />}
          {!isLoggedIn ? (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-zinc-600 hover:text-black">
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-[#FF5A1F] px-5 py-2 text-sm font-medium text-white hover:bg-[#e44e1a] transition-colors"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm font-medium text-zinc-600">
                {user?.name || "User"}
              </span>
            </div>
          )}

          {/* Dashboard Section for Profile Dropdown */}
          <div className="relative group ml-2">
            <button className="flex items-center gap-2 rounded-full border border-zinc-200 p-1 pl-3 hover:shadow-md transition-shadow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
              <div className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 overflow-hidden">
                {user?.image ? (
                  <img
                    src={getImageUrl(user.image)}
                    alt={user?.name || "Profile"}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = "/images/logo.png"
                    }}
                  />
                ) : (
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
                )}
              </div>
            </button>

            <div className="absolute right-0 mt-2 w-56 scale-95 opacity-0 invisible group-hover:visible group-hover:opacity-100 group-hover:scale-100 origin-top-right rounded-xl border border-zinc-100 bg-white p-2 shadow-xl transition-all duration-200">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">My Account</div>
              <button
                onClick={() => onNavigate?.("dashboard")}
                className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate?.("profile")}
                className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Profile
              </button>
              <button
                onClick={() => onNavigate?.("wishlist")}
                className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Wishlist
              </button>
              <button
                onClick={() => onNavigate?.("trips")}
                className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Trips
              </button>
              <button
                onClick={() => onNavigate?.("messages")}
                className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Messages
              </button>
              <button
                onClick={() => onNavigate?.("notifications")}
                className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Notifications
              </button>
              <div className="my-1 border-t border-zinc-100" />
              <button
                onClick={() => {
                  if (hostStatus?.isVerifiedHost) {
                    onNavigate?.("hostDashboard")
                  } else {
                    onNavigate?.("hostVerification")
                  }
                }}
                className="w-full text-left block rounded-lg px-3 py-2 text-sm text-[#FF5A1F] hover:bg-orange-50 font-medium"
              >
                Switch to hosting
              </button>
              <button
                onClick={handleLogoutClick}
                className="w-full text-left block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 font-medium"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
