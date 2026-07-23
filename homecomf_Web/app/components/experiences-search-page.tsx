"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getPublicExperiences } from "@/lib/api/listings"

interface ExperiencesSearchPageProps {
  onNavigate: (page: "stays" | "experiences" | "map") => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/images/logo.png"
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) return imagePath
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

export default function ExperiencesSearchPage({ onNavigate: _onNavigate }: ExperiencesSearchPageProps) {
  const [where, setWhere] = useState("")
  const [maxPrice, setMaxPrice] = useState<number | "">("")
  const [guests, setGuests] = useState<number | "">("")
  const [experiences, setExperiences] = useState<any[]>([])

  useEffect(() => {
    const loadExperiences = async () => {
      try {
        const res = await getPublicExperiences()
        const data = Array.isArray(res?.data) ? res.data : []
        setExperiences(data)
      } catch (error) {
        console.error("Failed to load experiences", error)
      }
    }

    loadExperiences()
  }, [])

  const filteredExperiences = experiences
    .filter((exp: any) => {
      if (!where.trim()) return true
      const q = where.toLowerCase()
      return String(exp?.location || "").toLowerCase().includes(q) || String(exp?.title || "").toLowerCase().includes(q)
    })
    .filter((exp: any) => {
      if (maxPrice === "" || Number.isNaN(Number(maxPrice))) return true
      return Number(exp?.price || 0) <= Number(maxPrice)
    })
    .filter((exp: any) => {
      if (guests === "" || Number.isNaN(Number(guests))) return true
      const requested = Number(guests)
      return Number(exp?.maxGuests || 1) >= requested
    })

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20 md:pb-0">
      {/* Search Bar */}
      <div className="bg-[#fcfcfc] border-b border-zinc-100 sticky top-0 z-10 backdrop-blur-md bg-[#fcfcfc]/80 pb-4 pt-6">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-3 flex flex-col md:flex-row items-center gap-3 md:gap-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
            <div className="hidden md:flex items-center justify-center p-3 rounded-full bg-zinc-50/80 text-[#FF5A1F] ml-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex-1 flex flex-col md:flex-row md:items-center w-full md:divide-x md:divide-zinc-100 gap-y-3 md:gap-y-0">
              <div className="flex-1 px-4">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Where</label>
                <input
                  type="text"
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="Search destination"
                  className="w-full text-sm font-semibold text-zinc-900 bg-transparent focus:outline-none placeholder:text-zinc-400"
                />
              </div>
              <div className="flex-1 px-4">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Max Price</label>
                <input
                  type="number"
                  value={maxPrice === "" ? "" : maxPrice}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "") {
                      setMaxPrice("")
                    } else {
                      const num = Number(val)
                      setMaxPrice(Number.isNaN(num) ? "" : Math.max(0, num))
                    }
                  }}
                  placeholder="Any price"
                  className="w-full text-sm font-semibold text-zinc-900 bg-transparent focus:outline-none placeholder:text-zinc-400"
                />
              </div>
              <div className="flex-1 px-4">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Who</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={guests === "" ? "" : guests}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "") {
                        setGuests("")
                      } else {
                        const num = Number(val)
                        setGuests(Number.isNaN(num) ? "" : Math.max(1, num))
                      }
                    }}
                    min={1}
                    placeholder="Add guests"
                    className="w-24 text-sm font-semibold text-zinc-900 bg-transparent focus:outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>
            <button className="w-full md:w-auto p-4 md:p-3 rounded-2xl md:rounded-full bg-[#FF5A1F] hover:bg-[#e44e1a] text-white flex items-center justify-center transition-colors shadow-sm">
              <span className="md:hidden font-bold mr-2">Search</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 md:py-12">
        <div>
          <h3 className="text-3xl font-extrabold text-zinc-900 mb-8 tracking-tight">Featured Experiences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredExperiences.map((exp: any) => (
              <Link
                key={exp._id}
                href={`/experiences/${exp._id}`}
                className="group bg-white rounded-[1.5rem] overflow-hidden border border-zinc-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 block relative"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                  <img
                    src={getImageUrl(exp.images?.[0])}
                    alt={exp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(event) => {
                      event.currentTarget.src = "/images/logo.png"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-5">
                  <h4 className="font-extrabold text-zinc-900 text-[17px] tracking-tight line-clamp-1 group-hover:text-[#FF5A1F] transition-colors mb-1">{exp.title}</h4>
                  <p className="text-sm font-medium text-zinc-500 mb-4 truncate flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {exp.location}
                  </p>
                  <div className="pt-4 border-t border-zinc-50 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-0.5">Price</span>
                      <p className="text-lg font-extrabold text-zinc-900 tracking-tight">
                        Rs. {exp.price} <span className="text-sm font-medium text-zinc-400 font-sans tracking-normal">per person</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {filteredExperiences.length === 0 && (
            <div className="text-center py-20 px-4">
              <div className="bg-zinc-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900 mb-2">No experiences found</h3>
              <p className="text-zinc-500 font-medium max-w-md mx-auto">Try adjusting your search criteria to find available experiences.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
