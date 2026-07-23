"use client"

import { useState } from "react"
import { MapPin, X, Heart } from "lucide-react"

interface MapPageProps {
  onNavigate: (page: "stays" | "experiences" | "map") => void
}

interface Property {
  id: number
  name: string
  location: string
  price: number
  lat: number
  lng: number
  image: string
}

export default function MapPage({ onNavigate }: MapPageProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])

  const properties: Property[] = [
    {
      id: 1,
      name: "Mountain Lodge",
      location: "Pokhara",
      price: 308,
      lat: 28.2096,
      lng: 83.9856,
      image: "🏔️",
    },
    {
      id: 2,
      name: "Luxury Villa",
      location: "Kathmandu",
      price: 1700,
      lat: 27.7172,
      lng: 85.324,
      image: "🏰",
    },
    {
      id: 3,
      name: "Cozy Homestay",
      location: "Bhaktapur",
      price: 502,
      lat: 27.6727,
      lng: 85.8265,
      image: "🏡",
    },
    {
      id: 4,
      name: "Riverside Cottage",
      location: "Chitwan",
      price: 392,
      lat: 27.4766,
      lng: 84.3254,
      image: "🏠",
    },
    {
      id: 5,
      name: "Hilltop Resort",
      location: "Nagarkot",
      price: 447,
      lat: 27.715,
      lng: 85.52,
      image: "🏛️",
    },
  ]

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]))
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-slate-900">homecomf</h1>
            <nav className="flex gap-8">
              <button onClick={() => onNavigate("stays")} className="text-slate-400 hover:text-slate-600 transition">
                Stays
              </button>
              <button
                onClick={() => onNavigate("experiences")}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                Experiences
              </button>
            </nav>
          </div>
          <button onClick={() => onNavigate("stays")} className="text-slate-600 hover:text-slate-900 transition">
            ← Back
          </button>
        </div>
      </header>

      {/* Map Container */}
      <div className="relative h-[calc(100vh-80px)] bg-gradient-to-br from-green-100 via-green-50 to-green-100 overflow-hidden">
        {/* Simplified Map Background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000">
          {/* Nepal outline simplified */}
          <path
            d="M 300 200 Q 400 150, 500 180 L 550 220 Q 600 250, 650 240 L 680 280 Q 700 320, 680 360 L 650 380 Q 600 390, 550 370 L 500 380 Q 450 390, 400 370 L 350 350 Q 300 340, 280 300 Z"
            fill="#E0E7FF"
            stroke="#94A3B8"
            strokeWidth="2"
          />
        </svg>

        {/* Property Markers */}
        <div className="absolute inset-0">
          {properties.map((property) => (
            <button
              key={property.id}
              onClick={() => setSelectedProperty(property)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{
                left: `${30 + property.lng}%`,
                top: `${20 + property.lat * 1.5}%`,
              }}
            >
              {/* Pulse effect */}
              <div className="absolute inset-0 bg-orange-500 rounded-full animate-pulse opacity-75" />
              {/* Marker */}
              <div className="relative w-12 h-12 bg-white border-2 border-orange-500 rounded-full flex items-center justify-center shadow-lg hover:w-16 hover:h-16 transition-all duration-200 group-hover:shadow-xl">
                <span className="text-lg">{property.image}</span>
              </div>
              {/* Price tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                Rs.{property.price}
              </div>
            </button>
          ))}
        </div>

        {/* Map Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <button className="w-12 h-12 bg-white rounded-lg shadow-lg hover:shadow-xl transition flex items-center justify-center text-xl hover:bg-slate-50">
            +
          </button>
          <button className="w-12 h-12 bg-white rounded-lg shadow-lg hover:shadow-xl transition flex items-center justify-center text-xl hover:bg-slate-50">
            −
          </button>
        </div>

        {/* Property Details Panel */}
        {selectedProperty && (
          <div className="absolute bottom-6 left-6 w-96 bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-8xl">
              {selectedProperty.image}
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedProperty.name}</h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedProperty.location}
                  </p>
                </div>
                <button onClick={() => toggleFavorite(selectedProperty.id)} className="transition">
                  <Heart
                    className={`w-6 h-6 ${
                      favorites.includes(selectedProperty.id) ? "fill-orange-500 text-orange-500" : "text-slate-300"
                    }`}
                  />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">Rs.{selectedProperty.price}</span>
                  <span className="text-slate-600">per night</span>
                </div>
              </div>

              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition">
                View Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
