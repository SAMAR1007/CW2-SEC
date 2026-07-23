"use client"

import { useState } from "react"
import { Camera, Loader2, Home, DoorOpen, Users } from "lucide-react"
import { createListing } from "@/lib/api/host"
import { AxiosError } from "axios"
import LocationPickerMap from "@/components/location-picker-map"

interface ListingCreationWizardProps {
  onClose: () => void
  onComplete: () => void
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

const PLACE_TYPE_OPTIONS = [
  {
    id: "entire_place",
    title: "An entire place",
    description: "Guests have the whole place to themselves.",
    icon: Home,
  },
  {
    id: "room",
    title: "A room",
    description: "Guests have their own room in a home, plus access to shared spaces.",
    icon: DoorOpen,
  },
  {
    id: "shared_room",
    title: "A shared room in a hostel",
    description: "Guests sleep in a shared room in a professionally managed hostel.",
    icon: Users,
  },
] as const

const GUEST_FAVORITES = [
  { id: "wifi", label: "Wifi", icon: "📶" },
  { id: "tv", label: "TV", icon: "📺" },
  { id: "kitchen", label: "Kitchen", icon: "🍳" },
  { id: "washer", label: "Washer", icon: "🧺" },
  { id: "free_parking", label: "Free parking on premises", icon: "🚗" },
  { id: "paid_parking", label: "Paid parking on premises", icon: "💰" },
  { id: "ac", label: "Air conditioning", icon: "❄️" },
  { id: "workspace", label: "Dedicated workspace", icon: "💻" },
]

const STANDOUT_AMENITIES = [
  { id: "pool", label: "Pool", icon: "🏊" },
  { id: "hot_tub", label: "Hot tub", icon: "🛁" },
  { id: "patio", label: "Patio", icon: "🏡" },
  { id: "bbq", label: "BBQ grill", icon: "🍖" },
  { id: "outdoor_dining", label: "Outdoor dining area", icon: "🍽️" },
  { id: "fire_pit", label: "Fire pit", icon: "🔥" },
  { id: "pool_table", label: "Pool table", icon: "🎱" },
  { id: "fireplace", label: "Indoor fireplace", icon: "🔥" },
  { id: "piano", label: "Piano", icon: "🎹" },
  { id: "exercise", label: "Exercise equipment", icon: "💪" },
  { id: "lake", label: "Lake access", icon: "🏞️" },
  { id: "beach", label: "Beach access", icon: "🏖️" },
  { id: "ski", label: "Ski-in/Ski-out", icon: "⛷️" },
  { id: "outdoor_shower", label: "Outdoor shower", icon: "🚿" },
]

const SAFETY_ITEMS = [
  { id: "smoke_alarm", label: "Smoke alarm", icon: "🔔" },
  { id: "first_aid", label: "First aid kit", icon: "➕" },
  { id: "fire_extinguisher", label: "Fire extinguisher", icon: "🧯" },
  { id: "co_alarm", label: "Carbon monoxide alarm", icon: "⚠️" },
]

const HIGHLIGHTS = [
  { id: "peaceful", label: "Peaceful", icon: "🏡" },
  { id: "unique", label: "Unique", icon: "✨" },
  { id: "family_friendly", label: "Family-friendly", icon: "👨‍👩‍👧" },
  { id: "stylish", label: "Stylish", icon: "🎨" },
  { id: "central", label: "Central", icon: "📍" },
  { id: "spacious", label: "Spacious", icon: "🏠" },
]

export default function ListingCreationWizard({ onClose, onComplete }: ListingCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    placeType: "" as "" | "entire_place" | "room" | "shared_room",
    location: "",
    latitude: 27.7172,
    longitude: 85.324,
    guests: 4,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    guestFavorites: [] as string[],
    standoutAmenities: [] as string[],
    safetyItems: [] as string[],
    images: [] as File[],
    title: "",
    highlights: [] as string[],
    description: "",
    // Default base price for new listings
    weekdayPrice: 1000,
    weekendPremium: 5,
    country: "Nepal",
    street: "",
    apt: "",
    city: "",
    province: "",
    postalCode: "",
  })

  const totalSteps = 12
  const progress = (currentStep / totalSteps) * 100

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field: keyof typeof formData, itemId: string) => {
    setFormData((prev) => {
      const current = (prev[field] as string[]) || []
      const updated = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
      return { ...prev, [field]: updated }
    })
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => (prev + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }))
  }

  const handleSubmit = async () => {
    // Client-side validation before sending
    if (!formData.title.trim()) {
      alert("Please provide a title for your listing.")
      return
    }
    if (!formData.location.trim() && !formData.city.trim()) {
      alert("Please set a location for your listing.")
      return
    }
    if (formData.weekdayPrice <= 0) {
      alert("Price must be greater than 0.")
      return
    }

    setLoading(true)
    try {
      await createListing({
        title: formData.title,
        location: formData.location || formData.city || "Location TBD",
        price: formData.weekdayPrice,
        weekendPrice: Math.round(formData.weekdayPrice * (1 + formData.weekendPremium / 100)),
        weekendPremium: formData.weekendPremium,
        description: formData.description,
        highlights: formData.highlights,
        amenities: formData.guestFavorites,
        standoutAmenities: formData.standoutAmenities,
        safetyItems: formData.safetyItems,
        images: formData.images,
        maxGuests: formData.guests,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.bathrooms,
        residentialAddress: {
          country: formData.country,
          street: formData.street,
          apt: formData.apt,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
        },
        isPublished: false,
      })
      onComplete()
    } catch (error) {
      console.error("Failed to create listing:", error)
      let msg = "Failed to create listing. Please try again."
      if (error instanceof AxiosError && error.response?.data?.message) {
        msg = error.response.data.message
      }
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return Boolean(formData.placeType)
      case 2:
      case 3:
        return formData.location.trim().length > 0
      case 4:
        return formData.guests >= 1 && formData.bedrooms >= 1 && formData.beds >= 1 && formData.bathrooms >= 1
      case 7:
        return formData.title.trim().length > 0
      case 10:
        return formData.weekdayPrice > 0
      default:
        return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-8">What type of place will guests have?</h1>
            <div className="space-y-4">
              {PLACE_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon
                const selected = formData.placeType === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateField("placeType", option.id)}
                    className={`w-full p-6 border-2 rounded-2xl text-left transition-all ${
                      selected ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <h2 className="text-3xl font-semibold text-zinc-900 mb-1">{option.title}</h2>
                        <p className="text-zinc-600 text-lg">{option.description}</p>
                      </div>
                      <Icon className="w-8 h-8 text-zinc-900 shrink-0" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Where&apos;s your place located?</h1>
            <p className="text-zinc-600 mb-6">Your address is only shared with guests after they&apos;ve made a reservation.</p>
            <LocationPickerMap
              mode="search"
              location={formData.location}
              coordinates={{ lat: formData.latitude, lng: formData.longitude }}
              onLocationChange={(value) => updateField("location", value)}
              onCoordinatesChange={(value) => {
                updateField("latitude", value.lat)
                updateField("longitude", value.lng)
              }}
            />
          </div>
        )

      case 3:
        return (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Is the pin in the right spot?</h1>
            <p className="text-zinc-600 mb-6">Your address is only shared with guests after they&apos;ve made a reservation.</p>
            <LocationPickerMap
              mode="confirm"
              location={formData.location}
              coordinates={{ lat: formData.latitude, lng: formData.longitude }}
              onLocationChange={(value) => updateField("location", value)}
              onCoordinatesChange={(value) => {
                updateField("latitude", value.lat)
                updateField("longitude", value.lng)
              }}
            />
          </div>
        )

      case 4:
        return (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Share some basics about your place</h1>
            <p className="text-zinc-600 mb-8">You&apos;ll add more details later, like bed types.</p>
            <div className="space-y-6">
              {[
                { key: "guests", label: "Guests", min: 1 },
                { key: "bedrooms", label: "Bedrooms", min: 1 },
                { key: "beds", label: "Beds", min: 1 },
                { key: "bathrooms", label: "Bathrooms", min: 1 },
              ].map(({ key, label, min }) => (
                <div key={key} className="flex items-center justify-between p-4 border border-zinc-200 rounded-xl">
                  <span className="font-medium text-zinc-900">{label}</span>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => updateField(key, Math.max(min, (formData[key as keyof typeof formData] as number) - 1))}
                      className="w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-100"
                    >
                      -
                    </button>
                    <span className="text-xl font-semibold w-8 text-center">
                      {formData[key as keyof typeof formData]}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateField(key, (formData[key as keyof typeof formData] as number) + 1)}
                      className="w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Tell guests what your place has to offer</h1>
            <p className="text-zinc-600 mb-8">You can add more amenities after you publish your listing.</p>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">What about these guest favorites?</h2>
              <div className="grid grid-cols-3 gap-4">
                {GUEST_FAVORITES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleArrayItem("guestFavorites", item.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      formData.guestFavorites.includes(item.id)
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Do you have any standout amenities?</h2>
              <div className="grid grid-cols-3 gap-4">
                {STANDOUT_AMENITIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleArrayItem("standoutAmenities", item.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      formData.standoutAmenities.includes(item.id)
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Do you have any of these safety items?</h2>
              <div className="grid grid-cols-4 gap-4">
                {SAFETY_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleArrayItem("safetyItems", item.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      formData.safetyItems.includes(item.id)
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Add some photos of your place</h1>
            <p className="text-zinc-600 mb-8">
              To get started, add some photos. You can add more or make changes later.
            </p>
            <div className="border-2 border-dashed border-zinc-300 rounded-xl p-16 text-center">
              <Camera className="w-20 h-20 text-zinc-400 mx-auto mb-4" />
              <input
                type="file"
                id="photos"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="photos"
                className="inline-block px-6 py-2 border border-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-50"
              >
                Add photos
              </label>
              {formData.images.length > 0 && (
                <p className="mt-4 text-sm text-zinc-600">{formData.images.length} photo(s) selected</p>
              )}
            </div>
          </div>
        )

      case 7:
        return (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Now, let&apos;s give your place a title</h1>
            <p className="text-zinc-600 mb-8">
              Short titles work best. Have fun with it—you can always change it later.
            </p>
            <textarea
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              maxLength={50}
              rows={3}
              className="w-full border border-zinc-300 rounded-lg p-4 text-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="Enter your listing title..."
            />
            <div className="mt-2 text-sm text-zinc-500 text-right">{formData.title.length}/50</div>
          </div>
        )

      case 8:
        return (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Next, let&apos;s describe your place</h1>
            <p className="text-zinc-600 mb-8">Choose up to 2 highlights. We&apos;ll use these to get your description started.</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {HIGHLIGHTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const current = formData.highlights
                    if (current.includes(item.id)) {
                      updateField("highlights", current.filter((id) => id !== item.id))
                    } else if (current.length < 2) {
                      updateField("highlights", [...current, item.id])
                    }
                  }}
                  className={`p-4 border-2 rounded-xl text-center transition-all ${
                    formData.highlights.includes(item.id)
                      ? "border-zinc-900 bg-zinc-50"
                      : formData.highlights.length >= 2
                        ? "border-zinc-200 opacity-50 cursor-not-allowed"
                        : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                </button>
              ))}
            </div>
          </div>
        )

      case 9:
        return (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Create your description</h1>
            <p className="text-zinc-600 mb-8">Share what makes your place special.</p>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              maxLength={500}
              rows={8}
              className="w-full border border-zinc-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="You'll have a great time at this comfortable place to stay."
            />
            <div className="mt-2 text-sm text-zinc-500 text-right">{formData.description.length}/500</div>
          </div>
        )

      case 10:
        return (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Now, set a weekday base price</h1>
            <p className="text-zinc-600 mb-2">
              Tip: Start from around Rs. 1000. You&apos;ll set a weekend price next.
            </p>
            <div className="text-center my-12">
              <div className="text-7xl font-bold text-zinc-900 mb-4">
                Rs. {formData.weekdayPrice || 0}
                <span className="inline-block w-1 h-16 bg-zinc-900 ml-2 animate-pulse"></span>
              </div>
              <div className="text-sm text-zinc-600 mb-8">
                Guest price before taxes Rs. {Math.round((formData.weekdayPrice || 0) * 1.15)} <span>▼</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg font-medium text-zinc-900">Rs.</span>
                <input
                  type="number"
                  value={formData.weekdayPrice}
                  onChange={(e) => {
                    const raw = e.target.value
                    const value = raw === "" ? 0 : Number(raw)
                    updateField("weekdayPrice", Number.isNaN(value) ? 0 : value)
                  }}
                  min={0}
                  className="w-40 text-center text-2xl font-semibold border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
            <p className="text-center text-sm text-zinc-600">
              <a href="#" className="underline">Learn more about pricing</a>
            </p>
          </div>
        )

      case 11:
        return (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Set a weekend price</h1>
            <p className="text-zinc-600 mb-8">Add a premium for Fridays and Saturdays.</p>
            <div className="text-center my-8">
              <div className="text-6xl font-bold text-zinc-900 mb-4">
                Rs. {Math.round(formData.weekdayPrice * (1 + formData.weekendPremium / 100))}
              </div>
              <div className="text-sm text-zinc-600 mb-8">
                Guest price before taxes Rs. {Math.round(formData.weekdayPrice * (1 + formData.weekendPremium / 100) * 1.15)}{" "}
                <span>▼</span>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-zinc-900">Weekend premium</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600">Tip: Try 5%</span>
                  <input
                    type="number"
                    value={formData.weekendPremium}
                    onChange={(e) => updateField("weekendPremium", Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                    className="w-20 px-3 py-1 border border-zinc-300 rounded-lg text-right"
                    min={0}
                    max={99}
                  />
                </div>
              </div>
              <input
                type="range"
                value={formData.weekendPremium}
                onChange={(e) => updateField("weekendPremium", parseInt(e.target.value))}
                min={0}
                max={99}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>0%</span>
                <span>99%</span>
              </div>
            </div>
          </div>
        )

      case 12:
        return (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Provide a few final details</h1>
            <p className="text-zinc-600 mb-2">
              This is required to comply with financial regulations and helps us prevent fraud.
            </p>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-1">What&apos;s your residential address?</h2>
            <p className="text-sm text-zinc-500 mb-6">Guests won&apos;t see this information.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Country/region</label>
                <select
                  value={formData.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option>Nepal</option>
                  <option>India</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Street address</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  placeholder="Street address"
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Apt, floor, bldg (if applicable)
                </label>
                <input
                  type="text"
                  value={formData.apt}
                  onChange={(e) => updateField("apt", e.target.value)}
                  placeholder="Apt, floor, bldg (if applicable)"
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">City / town / village</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City / town / village"
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Province / state / territory (if applicable)
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => updateField("province", e.target.value)}
                  placeholder="Province / state / territory (if applicable)"
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Postal code (if applicable)</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  placeholder="Postal code (if applicable)"
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-zinc-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-xl font-bold">homecomf</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-200">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-8rem)]">
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-2 text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create listing"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
