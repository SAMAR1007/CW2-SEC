"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { verify } from "@/lib/api/auth"
import { getThreadMessages, listConversations, sendMessage } from "@/lib/api/messages"

type Mode = "travelling" | "host"

interface Props {
  mode: Mode
}

interface Conversation {
  counterpart: { _id: string; name: string; image?: string }
  accommodationId?: string
  experienceId?: string
  contextTitle?: string
  lastMessage: string
  lastAt: string
  lastSenderId: string
  unreadCount?: number
  lastSeenAt?: string
}

interface ThreadMessage {
  _id: string
  senderId: { _id: string; name?: string; image?: string } | string
  recipientId: { _id: string; name?: string; image?: string } | string
  text: string
  createdAt: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return ""
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

const getId = (value: unknown) => {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id?: unknown })._id || "")
  }
  return ""
}

export default function MessagesCenter({ mode }: Props) {
  const searchParams = useSearchParams()
  const [currentUserId, setCurrentUserId] = useState("")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const containerHeightClass = mode === "host" ? "h-[calc(100vh-96px)]" : "h-[calc(100vh-64px)]"

  const isSameConversation = (a: Conversation | null, b: Conversation | null) => {
    if (!a || !b) return false
    return (
      a.counterpart._id === b.counterpart._id &&
      (a.accommodationId || "") === (b.accommodationId || "") &&
      (a.experienceId || "") === (b.experienceId || "")
    )
  }

  const refreshAll = async () => {
    if (selected) {
      await loadThread(selected)
    }
    await loadConversations()
  }

  const presetConversation = useMemo(() => {
    const counterpartId = searchParams.get("recipientId") || ""
    const counterpartName = searchParams.get("recipientName") || "Host"
    const accommodationId = searchParams.get("accommodationId") || undefined
    const experienceId = searchParams.get("experienceId") || undefined
    const contextTitle = searchParams.get("contextTitle") || undefined

    if (!counterpartId) return null
    return {
      counterpart: { _id: counterpartId, name: counterpartName },
      accommodationId,
      experienceId,
      contextTitle,
      lastMessage: "",
      lastAt: new Date().toISOString(),
      lastSenderId: "",
    } as Conversation
  }, [searchParams])

  const loadConversations = async () => {
    const items = (await listConversations(mode)) as Conversation[]
    setConversations((prev) => {
      const selectedMatch = selected
        ? items.find((item) => isSameConversation(item, selected))
        : null

      if (!selectedMatch) return items

      return items.map((item) =>
        isSameConversation(item, selected)
          ? { ...item, unreadCount: 0 }
          : item,
      )
    })

    if (selected) {
      const updatedSelected = items.find(
        (item) =>
          item.counterpart._id === selected.counterpart._id &&
          (item.accommodationId || "") === (selected.accommodationId || "") &&
          (item.experienceId || "") === (selected.experienceId || ""),
      )
      if (updatedSelected) {
        setSelected(updatedSelected)
      }
    }
  }

  const loadThread = async (conversation: Conversation) => {
    const items = await getThreadMessages({
      counterpartId: conversation.counterpart._id,
      accommodationId: conversation.accommodationId,
      experienceId: conversation.experienceId,
    })
    setThread(items)
  }

  useEffect(() => {
    const init = async () => {
      try {
        const auth = await verify()
        const userId = auth?.user?._id ? String(auth.user._id) : ""
        setCurrentUserId(userId)
        await loadConversations()
      } finally {
        setLoading(false)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    const timer = setInterval(() => {
      refreshAll().catch(() => undefined)
    }, 4000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selected?.counterpart._id, selected?.accommodationId, selected?.experienceId])

  useEffect(() => {
    if (!selected) {
      setThread([])
      return
    }
    const loadSelected = async () => {
      await loadThread(selected)
      await loadConversations()
    }
    loadSelected()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.counterpart._id, selected?.accommodationId, selected?.experienceId])

  const handleSend = async () => {
    if (!selected || !draft.trim()) return

    try {
      setSending(true)
      await sendMessage({
        recipientId: selected.counterpart._id,
        text: draft.trim(),
        accommodationId: selected.accommodationId,
        experienceId: selected.experienceId,
      })
      setDraft("")
      await Promise.all([loadThread(selected), loadConversations()])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`${containerHeightClass} bg-zinc-50 p-4 md:p-6 overflow-hidden`}>
      <div className="mx-auto max-w-7xl rounded-2xl border border-zinc-200 bg-white overflow-hidden grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] h-full">
        <aside className="border-r border-zinc-200 h-full overflow-hidden">
          <div className="p-4 border-b border-zinc-200">
            <h2 className="text-xl font-semibold text-zinc-900">{mode === "host" ? "Host messages" : "Your messages"}</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {loading ? (
              <p className="p-4 text-sm text-zinc-500">Loading chats...</p>
            ) : conversations.length === 0 && !presetConversation ? (
              <p className="p-4 text-sm text-zinc-500">No conversations yet.</p>
            ) : (
              (conversations.length ? conversations : presetConversation ? [presetConversation] : []).map((item) => {
                const isActive =
                  selected?.counterpart._id === item.counterpart._id &&
                  (selected?.accommodationId || "") === (item.accommodationId || "") &&
                  (selected?.experienceId || "") === (item.experienceId || "")

                return (
                  <button
                    key={`${item.counterpart._id}-${item.accommodationId || ""}-${item.experienceId || ""}`}
                    onClick={() => {
                      setSelected(item)
                      setConversations((prev) =>
                        prev.map((conversation) =>
                          isSameConversation(conversation, item)
                            ? { ...conversation, unreadCount: 0 }
                            : conversation,
                        ),
                      )
                    }}
                    className={`w-full text-left p-4 hover:bg-zinc-50 ${isActive ? "bg-orange-50" : ""}`}
                  >
                    <p className="text-sm font-semibold text-zinc-900">{item.counterpart.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">{item.contextTitle || "Chat"}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm text-zinc-600 line-clamp-1">{item.lastMessage || "Start conversation"}</p>
                      {!isActive && (item.unreadCount || 0) > 0 && (
                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[#FF5A1F] px-1 text-[10px] font-semibold text-white">
                          {item.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className="flex flex-col h-full overflow-hidden">
          {selected ? (
            <>
              <div className="p-4 border-b border-zinc-200 flex items-center gap-3">
                {selected.counterpart.image ? (
                  <img
                    src={getImageUrl(selected.counterpart.image)}
                    alt={selected.counterpart.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 font-semibold">
                    {selected.counterpart.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-zinc-900">{selected.counterpart.name}</p>
                  <p className="text-xs text-zinc-500">
                    {selected.contextTitle || "Conversation"}
                    {selected.lastSeenAt ? ` · Last seen ${new Date(selected.lastSeenAt).toLocaleString()}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-zinc-50">
                {thread.length === 0 ? (
                  <p className="text-sm text-zinc-500">No messages yet. Say hello.</p>
                ) : (
                  thread.map((item) => {
                    const isMine = getId(item.senderId) === currentUserId
                    return (
                      <div key={item._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            isMine ? "bg-[#FF5A1F] text-white" : "bg-white border border-zinc-200 text-zinc-800"
                          }`}
                        >
                          <p>{item.text}</p>
                          <p className={`mt-1 text-[10px] ${isMine ? "text-white/80" : "text-zinc-400"}`}>
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="p-4 border-t border-zinc-200 flex items-center gap-3">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="rounded-xl bg-[#FF5A1F] text-white px-5 py-3 text-sm font-semibold hover:bg-[#e44e1a] disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">Select a conversation</div>
          )}
        </section>
      </div>
    </div>
  )
}
