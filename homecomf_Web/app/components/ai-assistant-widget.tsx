"use client"

import { useMemo, useState } from "react"

interface AIAssistantWidgetProps {
  onNavigate?: (page: string) => void
}

type ChatMessage = {
  role: "assistant" | "user"
  text: string
}

const initialMessage: ChatMessage = {
  role: "assistant",
  text: "Hi! I can help you choose a stay or experience. Tell me your plan (budget, location, group size, and vibe).",
}

const buildAssistantReply = (input: string) => {
  const text = input.toLowerCase()
  const mentionsNepal = /nepal|kathmandu|pokhara|chitwan|lumbini|mustang|annapurna|everest/.test(text)
  const asksKathmandu = /kathm|katham|ktm|kathmandu/.test(text)
  const asksPlaces = /place|places|visit|go|trip|itinerary|see|do/.test(text)
  const wantsExperience = /experience|activity|adventure|tour|guide|hiking|food/.test(text)
  const wantsStay = /stay|hotel|room|villa|apartment|house/.test(text)
  const budgetLow = /cheap|budget|low|affordable|under/.test(text)
  const family = /family|kids|child|children/.test(text)
  const couple = /couple|honeymoon|romantic/.test(text)

  const tips: string[] = []
  if (asksKathmandu && asksPlaces) {
    tips.push("Great places in Kathmandu: Swayambhunath (Monkey Temple), Boudhanath Stupa, Pashupatinath, Kathmandu Durbar Square, Patan Durbar Square, Bhaktapur Durbar Square, and Garden of Dreams.")
    tips.push("If you like viewpoints and short hikes, add Nagarkot sunrise or Chandragiri Hills.")
  }
  if (mentionsNepal) {
    tips.push("Great picks in Nepal: Kathmandu (heritage), Pokhara (lakes + views), Chitwan (safari), Lumbini (peaceful heritage), and Mustang (mountain adventure).")
    tips.push("For 5-7 days: 2 days Kathmandu + 2 days Pokhara + 1-2 days Chitwan works well.")
  }
  if (wantsExperience) tips.push("Explore EXPERIENCE and filter by location/date first.")
  if (wantsStay) tips.push("Open STAY and compare amenities, host ratings, and cancellation flexibility.")
  if (budgetLow) tips.push("Sort by lower price first and keep dates flexible for better deals.")
  if (family) tips.push("Prioritize stays with more bedrooms, kitchen, and safety amenities.")
  if (couple) tips.push("Look for private stays with high review scores and scenic location.")
  if (!tips.length) {
    tips.push("Tell me your destination, budget per night, travel dates, and group size for better suggestions.")
  }

  return tips.join(" ")
}

export default function AIAssistantWidget({ onNavigate }: AIAssistantWidgetProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage])

  const quickActions = useMemo(
    () => [
      { label: "Find stays", page: "explore" },
      { label: "Find experiences", page: "experiences" },
      { label: "My trips", page: "trips" },
    ],
    []
  )

  const send = () => {
    const value = input.trim()
    if (!value) return

    const reply = buildAssistantReply(value)
    setMessages((prev) => [
      ...prev,
      { role: "user", text: value },
      { role: "assistant", text: reply },
    ])
    setInput("")
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[320px] rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 text-white">
            <p className="text-sm font-semibold inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 4.1L18 9l-4.1 1.9L12 15l-1.9-4.1L6 9l4.1-1.9L12 3z" />
                <path d="M19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
              </svg>
              homecomf Assistant
            </p>
            <button onClick={() => setOpen(false)} className="text-xs text-zinc-200 hover:text-white">Close</button>
          </div>

          <div className="px-3 py-2 flex flex-wrap gap-2 border-b border-zinc-100">
            {quickActions.map((action) => (
              <button
                key={action.page}
                type="button"
                onClick={() => onNavigate?.(action.page)}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="h-72 overflow-y-auto px-3 py-3 space-y-2 bg-zinc-50/50">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                  message.role === "assistant"
                    ? "bg-white border border-zinc-200 text-zinc-700"
                    : "ml-auto bg-[#FF5A1F] text-white"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-zinc-100 flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") send()
              }}
              placeholder="Ask for trip suggestions..."
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
            <button
              onClick={send}
              className="rounded-lg bg-[#FF5A1F] px-3 py-2 text-sm font-medium text-white hover:bg-[#e44e1a]"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#FF5A1F] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#e44e1a]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.9 4.1L18 9l-4.1 1.9L12 15l-1.9-4.1L6 9l4.1-1.9L12 3z" />
            <path d="M19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
          </svg>
          AI Help
        </button>
      )}
    </div>
  )
}
