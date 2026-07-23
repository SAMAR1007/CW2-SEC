"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getMyListings } from "@/lib/api/host"

type Listing = {
  _id: string
  title: string
  location: string
  price: number
  images: string[]
  isPublished: boolean
  bedrooms: number
  beds: number
  bathrooms: number
  maxGuests: number
}

type HostListingsPageProps = {
  onNavigate: (page: "hostExperiences") => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/images/logo.png"
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

export default function HostListingsPage({ onNavigate }: HostListingsPageProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await getMyListings()
        setListings(response.listings || [])
      } catch (error) {
        console.error("Failed to fetch listings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchListings()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF5A1F]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h1 className="text-3xl font-semibold text-gray-900">Your hosting</h1>
            <Link href="/host/create" className="rounded-lg bg-[#FF5A1F] text-white px-4 py-2 text-sm font-semibold hover:bg-[#E54F1A]">
              Create
            </Link>
          </div>
          <div className="mb-4 inline-flex rounded-full bg-zinc-100 p-1">
            <span className="px-4 py-2 rounded-full text-sm font-medium bg-white text-zinc-900">Stays</span>
            <button
              type="button"
              onClick={() => onNavigate("hostExperiences")}
              className="px-4 py-2 rounded-full text-sm font-medium text-zinc-700"
            >
              Experiences
            </button>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Your listings</h2>
          <p className="text-gray-600 mt-2">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">You haven't created any listings yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing._id}
                href={`/host/listings/${listing._id}`}
                className="group cursor-pointer"
              >
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative w-full h-64 bg-gray-200">
                    {listing.images && listing.images.length > 0 ? (
                      <Image
                        src={getImageUrl(listing.images[0])}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                    {!listing.isPublished && (
                      <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-full shadow-md">
                        <span className="text-sm font-medium text-gray-900">
                          Action required
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#FF5A1F] transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{listing.location}</p>
                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-gray-900 font-semibold">Rs. {listing.price}</span>
                      <span className="text-gray-500 text-sm">/ night</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <span>{listing.maxGuests} guests</span>
                      <span>·</span>
                      <span>{listing.bedrooms} bedroom{listing.bedrooms !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
