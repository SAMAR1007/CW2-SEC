"use client"

import { useState } from "react"
import { Search, MapPin, Calendar, Users } from "lucide-react"

interface StaysSearchPageProps {
  onNavigate: (page: "stays" | "experiences" | "map") => void
}

export default function StaysSearchPage({ onNavigate }: StaysSearchPageProps) {
  const [destination, setDestination] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState("")
  const [flexibility, setFlexibility] = useState(false)

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight text-[#FF5A1F]">homecomf</h1>
            <nav className="flex gap-6">
              <button
                onClick={() => onNavigate("stays")}
                className="text-zinc-900 font-bold border-b-2 border-[#FF5A1F] pb-1"
              >
                Stays
              </button>
              <button
                onClick={() => onNavigate("experiences")}
                className="text-zinc-500 hover:text-zinc-900 font-semibold transition-colors"
              >
                Experiences
              </button>
            </nav>
          </div>
          <button onClick={() => onNavigate("map")} className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors bg-zinc-50 hover:bg-zinc-100 px-4 py-2 rounded-full border border-zinc-200">
            Map View
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left side - Hero text */}
          <div className="space-y-8 lg:pr-8">
            <h2 className="text-5xl lg:text-6xl font-extrabold text-zinc-900 leading-[1.1] tracking-tight">Book your next stay in Nepal</h2>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed">
              Discover unique places to stay hosted by locals. Experience authentic Nepali hospitality.
            </p>
            <div className="flex gap-6 text-sm font-semibold text-zinc-600 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm inline-flex">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-[#FF5A1F] rounded-full shadow-[0_0_8px_rgba(255,90,31,0.5)]" />
                Verified hosts
              </div>
              <div className="w-px h-5 bg-zinc-200"></div>
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                Secure payments
              </div>
            </div>
          </div>

          {/* Right side - Search form */}
          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-zinc-100 p-8 md:p-10 relative">
            <div className="absolute top-0 right-10 -translate-y-1/2 w-24 h-2 bg-gradient-to-r from-[#FF5A1F]/0 via-[#FF5A1F]/40 to-[#FF5A1F]/0 blur-md rounded-full"></div>
            
            <div className="mb-8">
              <h3 className="text-2xl font-extrabold text-zinc-900 mb-5 tracking-tight">Where to?</h3>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-[#FF5A1F] transition-colors" />
                <input
                  type="text"
                  placeholder="Search destinations"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 focus:border-[#FF5A1F] font-medium text-zinc-900 transition-all placeholder:text-zinc-400"
                />
              </div>

              {/* Destination quick picks */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <button className="p-4 border border-zinc-200 rounded-2xl hover:border-[#FF5A1F] hover:shadow-[0_4px_12px_rgb(255,90,31,0.1)] hover:-translate-y-1 transition-all group text-left bg-white">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">🌍</div>
                  <div className="text-sm font-bold text-zinc-900">I'm flexible</div>
                </button>
                <button className="p-4 border border-zinc-200 rounded-2xl hover:border-[#FF5A1F] hover:shadow-[0_4px_12px_rgb(255,90,31,0.1)] hover:-translate-y-1 transition-all group text-left bg-white">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">🏔️</div>
                  <div className="text-sm font-bold text-zinc-900">Pokhara</div>
                </button>
                <button className="p-4 border border-zinc-200 rounded-2xl hover:border-[#FF5A1F] hover:shadow-[0_4px_12px_rgb(255,90,31,0.1)] hover:-translate-y-1 transition-all group text-left bg-white">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">🏛️</div>
                  <div className="text-sm font-bold text-zinc-900">Kathmandu</div>
                </button>
              </div>
            </div>

            {/* Price and Guests */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-500 mb-2">Min Price</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF5A1F] font-bold transition-colors">NPR</div>
                  <input
                    type="number"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-3 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 focus:border-[#FF5A1F] font-medium text-zinc-900 text-sm transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-500 mb-2">Max Price</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF5A1F] font-bold transition-colors">NPR</div>
                  <input
                    type="number"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    placeholder="10000+"
                    className="w-full pl-12 pr-3 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 focus:border-[#FF5A1F] font-medium text-zinc-900 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Guests */}
            <div className="mb-6">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-500 mb-2">Guests</label>
              <div className="relative group">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-[#FF5A1F] transition-colors" />
                <input
                  type="text"
                  placeholder="Add guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 focus:border-[#FF5A1F] font-medium text-zinc-900 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Flexibility toggle */}
            <div className="flex items-center gap-3 mb-8 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              <input
                type="checkbox"
                id="flexible"
                checked={flexibility}
                onChange={(e) => setFlexibility(e.target.checked)}
                className="w-4 h-4 accent-[#FF5A1F] rounded cursor-pointer"
              />
              <label htmlFor="flexible" className="text-sm font-semibold text-zinc-700 cursor-pointer select-none">
                I'm flexible with dates
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDestination("")
                  setCheckIn("")
                  setCheckOut("")
                  setGuests("")
                  setFlexibility(false)
                }}
                className="flex-1 py-3.5 text-zinc-600 font-bold hover:bg-zinc-100 hover:text-zinc-900 rounded-xl transition-colors border border-transparent hover:border-zinc-200"
              >
                Clear all
              </button>
              <button className="flex-[2] bg-[#FF5A1F] hover:bg-[#e44e1a] hover:shadow-[0_4px_12px_rgb(255,90,31,0.3)] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Search Stays
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
