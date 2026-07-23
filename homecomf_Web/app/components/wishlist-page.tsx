"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Heart, MapPin, Star } from "lucide-react"
import { getPublicListings } from "@/lib/api/listings"
import { getWishlist } from "@/lib/api/wishlist"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

type ListingCard = {
  _id: string
  title: string
  location: string
  price: number
  image: string
}

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/images/logo.png"
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

export default function WishlistPage() {
  const [loading, setLoading] = useState(true)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [listings, setListings] = useState<ListingCard[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const parsed = await getWishlist()
        setSavedIds(parsed)

        const res = await getPublicListings()
        const data = Array.isArray(res.data) ? res.data : []
        const mapped: ListingCard[] = data
          .filter((item: any) => parsed.includes(item._id) && item.isPublished)
          .map((item: any) => ({
            _id: item._id,
            title: item.title,
            location: item.location,
            price: item.price,
            image: getImageUrl(item.images?.[0]),
          }))

        setListings(mapped)
      } catch (error) {
        console.error("Failed to load wishlist", error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const hasWishlist = useMemo(() => savedIds.length > 0, [savedIds])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-zinc-200 rounded-full mb-4"></div>
          <div className="text-zinc-400 font-semibold tracking-tight">Loading wishlist...</div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10 md:py-16">
        <div className="mb-10 block">
          <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-3">Wishlist</h1>
          <p className="text-lg text-zinc-500 font-medium tracking-tight">Your saved places</p>
        </div>

        {!hasWishlist || listings.length === 0 ? (
          <div className="rounded-[2rem] border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-12 lg:p-20 text-center transition-all hover:bg-zinc-50 flex flex-col items-center justify-center">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm border border-zinc-100">
              <Heart className="w-8 h-8 text-zinc-300" />
            </div>
            <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 tracking-tight">No saved stays yet</h3>
            <p className="text-zinc-500 font-medium max-w-md text-lg">Tap the heart icon on any stay to save it to your wishlist and start planning your next getaway.</p>
            <Link 
              href="/stays"
              className="inline-block mt-8 px-8 py-3.5 bg-[#FF5A1F] text-white font-extrabold rounded-full hover:bg-[#e44e1a] hover:shadow-[0_8px_20px_rgba(255,90,31,0.25)] transition-all scale-95 hover:scale-100"
            >
              Start exploring
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {listings.map((item) => (
              <Link key={item._id} href={`/stays/${item._id}`} className="group bg-white rounded-[1.5rem] overflow-hidden border border-zinc-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 block relative">
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(event) => {
                      event.currentTarget.src = "/images/logo.png"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-transform hover:scale-110">
                    <Heart className="w-5 h-5 fill-[#FF5A1F] text-[#FF5A1F]" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-extrabold text-zinc-900 text-[17px] tracking-tight line-clamp-1 group-hover:text-[#FF5A1F] transition-colors mb-1">{item.title}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-zinc-500 mb-4">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  <div className="pt-4 border-t border-zinc-50 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-0.5">Price</span>
                      <p className="text-lg font-extrabold text-zinc-900 tracking-tight">Rs. {item.price} <span className="text-sm font-medium text-zinc-400 font-sans tracking-normal">/ night</span></p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
