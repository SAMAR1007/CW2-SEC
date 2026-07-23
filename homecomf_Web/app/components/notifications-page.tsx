"use client"

import { useEffect, useMemo, useState } from "react"
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications"

type FilterType = "all" | "unread"

interface AppNotification {
  _id: string
  type: string
  title: string
  message: string
  targetPage?: string
  isRead: boolean
  createdAt: string
}

interface NotificationsPageProps {
  mode?: "travelling" | "host"
  onNavigate?: (page: string) => void
}

export default function NotificationsPage({ mode = "travelling", onNavigate }: NotificationsPageProps) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("all")
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await listNotifications(100, mode)
      setItems(Array.isArray(data.notifications) ? data.notifications : [])
      setUnreadCount(Number(data.unreadCount || 0))
    } catch {
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [mode])

  const formatDateTime = (value?: string) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const filteredItems = useMemo(() => {
    if (filter === "unread") return items.filter((item) => !item.isRead)
    return items
  }, [items, filter])

  const openNotification = async (item: AppNotification) => {
    if (!item.isRead) {
      try {
        await markNotificationRead(item._id)
        setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
      }
    }

    if (item.targetPage) {
      const target = mode === 'host' && item.targetPage === 'notifications'
        ? 'hostNotifications'
        : item.targetPage
      onNavigate?.(target)
    }
  }

  const onMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })))
      setUnreadCount(0)
    } catch {
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Notifications</h1>
          <p className="text-sm text-zinc-600">Important updates about bookings, messages, and host status.</p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Mark all as read
        </button>
      </div>

      <div className="mb-4 inline-flex rounded-lg border border-zinc-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === "all" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50"}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === "unread" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50"}`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {loading ? (
          <div className="px-4 py-10 text-sm text-zinc-500">Loading notifications...</div>
        ) : filteredItems.length === 0 ? (
          <div className="px-4 py-10 text-sm text-zinc-500">No notifications found.</div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => openNotification(item)}
              className={`w-full border-b border-zinc-100 px-4 py-3 text-left hover:bg-zinc-50 ${item.isRead ? "" : "bg-orange-50/40"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{item.message}</p>
                </div>
                {!item.isRead && <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#FF5A1F]" />}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{formatDateTime(item.createdAt)}</p>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
