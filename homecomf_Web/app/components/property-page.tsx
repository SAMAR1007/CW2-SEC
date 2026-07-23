"use client"

import { Heart, Share2, MapPin, Users, Bed, Wind, Star, MapPinIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PropertyPageProps {
  onNavigate?: (page: "property" | "trips" | "search") => void
}

export default function PropertyPage({ onNavigate }: PropertyPageProps) {
  return (
    <main className="w-full">
      {/* Header Navigation */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">homecomf</h1>
          <nav className="flex gap-8 items-center">
            <button onClick={() => onNavigate?.("search")} className="text-sm hover:text-muted-foreground transition">
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

      {/* Hero Image Gallery */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-2 h-96 rounded-xl overflow-hidden">
          <img src="/mountain-lodge-nepal-pokhara.jpg" alt="Main property" className="col-span-2 w-full h-full object-cover" />
          <div className="grid grid-rows-2 gap-2">
            <img src="/cozy-bedroom.png" alt="Bedroom" className="w-full h-full object-cover" />
            <img src="/mountain-view-terrace.jpg" alt="Terrace" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-3 gap-12 py-12">
        {/* Main Content */}
        <div className="col-span-2">
          {/* Title and Details */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-balance">Private room in nature lodge in Pokhara, Nepal</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span className="font-semibold">5.0</span>
                <span className="text-muted-foreground">· 3 reviews</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="text-muted-foreground">Pokhara, Nepal</span>
              </div>
            </div>
          </div>

          {/* Host Info */}
          <div className="border-b border-border pb-8 mb-8">
            <div className="flex items-center gap-4">
              <img src="/host-avatar-profile.jpg" alt="Host" className="w-16 h-16 rounded-full" />
              <div>
                <h3 className="font-semibold">Hosted by Nanda Lal</h3>
                <p className="text-sm text-muted-foreground">3 years hosting · Superhost</p>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="border-b border-border pb-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">What this place offers</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <Users className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">3 guests</p>
                  <p className="text-sm text-muted-foreground">Maximum occupancy</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Bed className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">3 bedrooms · 6 beds</p>
                  <p className="text-sm text-muted-foreground">Sleep comfortably</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Wind className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">1 shared bath</p>
                  <p className="text-sm text-muted-foreground">Bath facilities</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPinIcon className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Park for free</p>
                  <p className="text-sm text-muted-foreground">One of the few places with free parking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">About this property</h2>
            <p className="text-muted-foreground leading-relaxed">
              Experience authentic Nepali hospitality in our stunning nature lodge nestled in the heart of Pokhara. Wake
              up to breathtaking mountain views and enjoy the serenity of our lush gardens. Perfect for travelers
              seeking comfort and natural beauty.
            </p>
          </div>
        </div>

        {/* Booking Card */}
        <div>
          <Card className="sticky top-24 p-6">
            <div className="mb-6">
              <p className="text-3xl font-bold">
                Rs.3,600 <span className="text-lg text-muted-foreground font-normal">per night</span>
              </p>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-4 py-6 text-lg">Reserve</Button>

            <div className="space-y-4 text-sm mb-6 pb-6 border-b border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rs.3,600 × 2 nights</span>
                <span>Rs.7,200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service fee</span>
                <span>Rs.720</span>
              </div>
            </div>

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>Rs.7,920</span>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="icon" className="flex-1 bg-transparent">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="flex-1 bg-transparent">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </main>
  )
}
