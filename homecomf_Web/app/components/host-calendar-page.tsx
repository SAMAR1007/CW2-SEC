"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { getHostReservations } from "@/lib/api/host"

type CalendarBookingType = "stay" | "experience"

type CalendarBooking = {
  id: string
  type: CalendarBookingType
  startDate: Date
  endDate: Date
}

const toStartOfDay = (value: Date) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const toDateKey = (value: Date) => {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, "0")
  const day = `${value.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const expandDateRange = (startDate: Date, endDate: Date) => {
  const dates: Date[] = []
  const current = toStartOfDay(startDate)
  const finalDate = toStartOfDay(endDate)

  while (current.getTime() <= finalDate.getTime()) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

const parseReservationBookings = (items: any[]): CalendarBooking[] => {
  return items
    .map((item) => {
      const type: CalendarBookingType | null = item?.accommodationId ? "stay" : item?.experienceId ? "experience" : null
      if (!type) return null

      const startDate = new Date(item?.startDate)
      const endDate = new Date(item?.endDate)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null

      return {
        id: String(item?._id || `${type}-${startDate.toISOString()}`),
        type,
        startDate,
        endDate,
      }
    })
    .filter((item): item is CalendarBooking => item !== null)
}

export default function HostCalendarPage() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [month, setMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const monthLabel = month.toLocaleString("en-US", { month: "long", year: "numeric" })

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const response = await getHostReservations()
        const reservationItems = Array.isArray(response?.reservations) ? response.reservations : []
        setBookings(parseReservationBookings(reservationItems))
      } catch {
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [])

  const { stayDates, experienceDates, bothDates } = useMemo(() => {
    const staySet = new Set<string>()
    const experienceSet = new Set<string>()

    bookings.forEach((booking) => {
      const allDates = expandDateRange(booking.startDate, booking.endDate)
      allDates.forEach((date) => {
        const key = toDateKey(date)
        if (booking.type === "stay") {
          staySet.add(key)
        } else {
          experienceSet.add(key)
        }
      })
    })

    const bothSet = new Set<string>()
    staySet.forEach((dateKey) => {
      if (experienceSet.has(dateKey)) {
        bothSet.add(dateKey)
        staySet.delete(dateKey)
        experienceSet.delete(dateKey)
      }
    })

    const toDateList = (set: Set<string>) =>
      Array.from(set).map((dateKey) => {
        const [year, monthValue, day] = dateKey.split("-").map(Number)
        return new Date(year, monthValue - 1, day)
      })

    return {
      stayDates: toDateList(staySet),
      experienceDates: toDateList(experienceSet),
      bothDates: toDateList(bothSet),
    }
  }, [bookings])

  const totalStayBookings = bookings.filter((item) => item.type === "stay").length
  const totalExperienceBookings = bookings.filter((item) => item.type === "experience").length

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">Calendar</h1>
          <p className="text-zinc-600 mt-1">See booked dates for your stays and experiences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Stay reservations</p>
            <p className="text-2xl font-bold text-zinc-900">{totalStayBookings}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Experience reservations</p>
            <p className="text-2xl font-bold text-zinc-900">{totalExperienceBookings}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 md:p-5">
          {loading ? (
            <div className="h-140 flex items-center justify-center text-zinc-500">Loading calendar...</div>
          ) : (
            <div className="w-full max-w-3xl mx-auto">
              <div className="mb-3 text-center text-sm sm:text-base font-semibold text-zinc-800">{monthLabel}</div>
              <Calendar
                numberOfMonths={1}
                month={month}
                onMonthChange={setMonth}
                onDayClick={(day) => setSelectedDate(toStartOfDay(day))}
                showOutsideDays
                className="mx-auto w-full [&_.rdp-month]:w-full [&_.rdp-month_grid]:w-full [&_.rdp-weeks]:w-full [&_.rdp-week]:w-full [&_.rdp-day]:w-full [--cell-size:clamp(3rem,9vw,5.75rem)]"
                classNames={{
                  root: "w-full",
                  nav: "hidden",
                  months: "w-full justify-center",
                  month: "w-full",
                  month_caption: "sr-only",
                  table: "w-full table-fixed border-collapse",
                  weekdays: "grid grid-cols-7 gap-0",
                  weekday: "text-center text-xs sm:text-sm text-zinc-600",
                  week: "grid grid-cols-7 mt-2",
                  day: "text-center",
                }}
                modifiers={{
                  stayBooked: stayDates,
                  experienceBooked: experienceDates,
                  bothBooked: bothDates,
                  selectedDate: selectedDate ? [selectedDate] : [],
                }}
                modifiersClassNames={{
                  stayBooked: "bg-emerald-100 text-emerald-800 rounded-md",
                  experienceBooked: "bg-amber-100 text-amber-800 rounded-md",
                  bothBooked: "bg-violet-100 text-violet-800 rounded-md",
                  selectedDate: "ring-2 ring-sky-500 ring-inset rounded-md",
                }}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-zinc-700">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              Stay booked
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-zinc-700">
              <span className="size-2.5 rounded-full bg-amber-500" />
              Experience booked
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-zinc-700">
              <span className="size-2.5 rounded-full bg-violet-500" />
              Both booked
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-zinc-700">
              <span className="size-2.5 rounded-full bg-sky-500" />
              Selected day
            </div>
          </div>
        </div>

        <div className="mt-5 max-w-4xl mx-auto grid grid-cols-3 items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            className="justify-self-start rounded-full border border-zinc-200 bg-white min-w-16 h-12 px-5 text-lg font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              const today = new Date()
              setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
              setSelectedDate(toStartOfDay(today))
            }}
            className="justify-self-center rounded-full border border-zinc-200 bg-white min-w-28 h-12 px-6 text-base font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Today
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            className="justify-self-end rounded-full border border-zinc-200 bg-white min-w-16 h-12 px-5 text-lg font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
