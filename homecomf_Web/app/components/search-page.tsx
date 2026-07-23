"use client"

import { useState } from "react"
import { MapPin, Calendar, Users, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface SearchPageProps {
  onNavigate?: (page: "property" | "trips" | "search") => void
}

export default function SearchPage({ onNavigate }: SearchPageProps) {
  const [tripType, setTripType] = useState<"dates" | "months" | "flexible">("dates")

  return (
    <main className="w-full min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">homecomf</h1>
          <nav className="flex gap-8 items-center">
            <button onClick={() => onNavigate?.("search")} className="text-sm font-semibold">
              Search
            </button>
            <button onClick={() => onNavigate?.("trips")} className="text-sm hover:text-muted-foreground transition">
              Trips
            </button>
            <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-12 text-balance">Find your next stay</h1>

        {/* Search Card */}
        <Card className="p-8 mb-12">
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Location Input */}
            <div>
              <label className="text-sm font-semibold block mb-2">Where</label>
              <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Shey Phoksundo, Nepal"
                  className="flex-1 border-0 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Check In */}
            <div>
              <label className="text-sm font-semibold block mb-2">When</label>
              <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <Input type="date" className="flex-1 border-0 outline-none bg-transparent" />
              </div>
            </div>

            {/* Guests */}
            <div>
              <label className="text-sm font-semibold block mb-2">Guests</label>
              <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                <Users className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="2 guests"
                  className="flex-1 border-0 outline-none bg-transparent"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Trip Duration Selector */}
          <div className="mb-8 pb-8 border-b border-border">
            <label className="text-sm font-semibold block mb-4">When's your trip?</label>
            <div className="flex gap-4">
              {(["dates", "months", "flexible"] as const).map((type) => (
                <Button
                  key={type}
                  variant={tripType === type ? "default" : "outline"}
                  onClick={() => setTripType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Duration Display */}
          {tripType === "months" && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-orange-500 bg-orange-50 mb-4">
                <div>
                  <p className="text-5xl font-bold text-orange-600">3</p>
                  <p className="text-sm font-semibold text-muted-foreground">months</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Starting July 1 · </p>
            </div>
          )}

          {/* Search Button */}
          <Button
            onClick={() => onNavigate?.("property")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-semibold"
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </Card>

        {/* Featured Properties */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Inspiration for your next trip</h2>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="overflow-hidden hover:shadow-lg transition cursor-pointer"
                onClick={() => onNavigate?.("property")}
              >
                <img
                  src={`/nepal-property-listing-.jpg?height=250&width=400&query=nepal property listing ${i}`}
                  alt="Featured property"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold mb-1">Beautiful stay in Nepal</h3>
                  <p className="text-sm text-muted-foreground">From Rs. 2,500 per night</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
