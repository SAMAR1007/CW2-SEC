"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, MapPin, Star, MessageCircle } from "lucide-react"
import { getPublicListings } from "@/lib/api/listings"
import { getWishlist, toggleWishlistItem } from "@/lib/api/wishlist"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/images/logo.png"
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) return imagePath
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

interface Property {
  id: string
  title: string
  location: string
  rating: number
  reviews: number
  pricePerNight: number
  image: string
  category: string
  maxGuests: number
}

export default function ExplorePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [properties, setProperties] = useState<Property[]>([])
  const [where, setWhere] = useState("")
  const [maxPrice, setMaxPrice] = useState<number | "">("")
  const [guests, setGuests] = useState<number | "">("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPublicListings()
        const data = Array.isArray(res.data) ? res.data : []
        const mapped: Property[] = data
          .map((item: any) => ({
            id: item._id,
            title: item.title,
            location: item.location,
            rating: 4.8,
            reviews: 0,
            pricePerNight: item.price,
            image: getImageUrl((item.images && item.images[0]) || "/images/logo.png"),
            category: item.placeType || "entire_place",
            maxGuests: item.maxGuests || 1,
          }))
        setProperties(mapped)
      } catch (error) {
        console.error("Failed to load listings for explore page", error)
      }
    }
    load()
  }, [])

  useEffect(() => {
    getWishlist().then((ids) => setFavorites(new Set(ids)))
  }, [])

  const filteredProperties = properties
    .filter((p) => {
      if (!where.trim()) return true
      const q = where.toLowerCase()
      return p.location.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)
    })
    .filter((p) => {
      if (maxPrice === "" || Number.isNaN(Number(maxPrice))) return true
      return p.pricePerNight <= Number(maxPrice)
    })
    .filter((p) => {
      if (guests === "" || Number.isNaN(Number(guests))) return true
      return p.maxGuests >= Number(guests)
    })

  const toggleFavorite = async (id: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
    } else {
      newFavorites.add(id)
    }
    setFavorites(newFavorites)
    const result = await toggleWishlistItem(id)
    setFavorites(new Set(result.data))
  }

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
                  className="w-full text-sm font-semibold text-zinc-900 bg-transparent focus:outline-none placeholder:text-zinc-400 placeholder:font-medium"
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
              <svg className="w-5 h-5 mr-1 md:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredProperties.map((property) => (
            <Link
              key={property.id}
              href={`/stays/${property.id}`}
              className="group bg-white rounded-[1.5rem] overflow-hidden border border-zinc-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 block relative"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                <img
                  src={property.image || "/images/logo.png"}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(event) => {
                    event.currentTarget.src = "/images/logo.png"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    toggleFavorite(property.id)
                  }}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-white/70 backdrop-blur-md hover:bg-white shadow-sm hover:scale-110 transition-all duration-300 z-10"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${favorites.has(property.id) ? "fill-[#FF5A1F] text-[#FF5A1F]" : "text-zinc-600"}`}
                  />
                </button>
              </div>

              {/* Property Details */}
              <div className="p-5">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-extrabold text-zinc-900 text-[17px] tracking-tight line-clamp-1 group-hover:text-[#FF5A1F] transition-colors">{property.title}</h3>
                  <div className="flex items-center gap-1 bg-zinc-50 px-1.5 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-[#FF5A1F] text-[#FF5A1F]" />
                    <span className="font-bold text-zinc-900 text-xs">{property.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{property.location}</span>
                </div>

                <div className="pt-4 border-t border-zinc-50 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-0.5">Price</span>
                    <p className="text-lg font-extrabold text-zinc-900 tracking-tight">
                      Rs. {property.pricePerNight} <span className="text-sm font-medium text-zinc-400 font-sans tracking-normal">night</span>
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {filteredProperties.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="bg-zinc-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-zinc-900 mb-2">No properties found</h3>
            <p className="text-zinc-500 font-medium max-w-md mx-auto">Try adjusting your search destination or guest count to find what you're looking for.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-zinc-100 pb-safe z-50">
        <div className="flex justify-around py-3 px-2">
          <button onClick={() => onNavigate("explore")} className="flex flex-col items-center gap-1.5 text-[#FF5A1F]">
            <div className="p-1.5 bg-orange-50 rounded-xl">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold tracking-wide">Explore</span>
          </button>
          <button onClick={() => onNavigate("wishlist")} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
            <div className="p-1.5">
              <Heart className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[10px] font-semibold tracking-wide">Wishlist</span>
          </button>
          <button onClick={() => onNavigate("trips")} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
            <div className="p-1.5">
              <MessageCircle className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[10px] font-semibold tracking-wide">Trips</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
            <div className="p-1.5">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold tracking-wide">Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}
