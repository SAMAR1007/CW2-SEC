"use client"

import { useMemo, useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import LocationPickerMap from "@/components/location-picker-map"
import { createExperience } from "@/lib/api/host"

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

const EXPERIENCE_TYPES = [
  { id: "art_design", label: "Art and design" },
  { id: "fitness_wellness", label: "Fitness and wellness" },
  { id: "food_drink", label: "Food and drink" },
  { id: "history_culture", label: "History and culture" },
  { id: "nature_outdoors", label: "Nature and outdoors" },
]

interface Props {
  onClose: () => void
  onComplete: () => void
}

export default function ExperienceCreationWizard({ onClose, onComplete }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [newAvailableDate, setNewAvailableDate] = useState("")
  const [form, setForm] = useState({
    category: "",
    yearsOfExperience: 1,
    location: "",
    coordinates: { lat: 27.7172, lng: 85.324 },
    images: [] as File[],
    itinerary: [{ title: "", description: "", duration: "1 hr" }],
    availableDates: [] as string[],
    maxGuests: 1,
    title: "",
    description: "",
    price: 1500,
    duration: "2 hours",
    address: {
      country: "Nepal",
      street: "",
      apt: "",
      city: "",
      province: "",
      postalCode: "",
    },
  })

  const canContinue = useMemo(() => {
    if (step === 1) return !!form.category
    if (step === 2) return form.yearsOfExperience >= 0
    if (step === 3) return form.location.trim().length > 0
    if (step === 4) return form.images.length >= 5
    if (step === 5) return form.itinerary.some((item) => item.title.trim())
    if (step === 6) return form.availableDates.length > 0
    if (step === 7) return form.maxGuests > 0
    if (step === 8) return form.title.trim().length > 0 && form.description.trim().length > 0
    return true
  }, [step, form])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await createExperience({
        title: form.title,
        category: form.category,
        location: form.location,
        price: form.price,
        duration: form.duration,
        yearsOfExperience: form.yearsOfExperience,
        maxGuests: form.maxGuests,
        description: form.description,
        images: form.images,
        itinerary: form.itinerary.filter((item) => item.title.trim()),
        availableDates: form.availableDates,
        residentialAddress: {
          country: form.address.country,
          street: form.address.street,
          apt: form.address.apt,
          city: form.address.city,
          province: form.address.province,
          postalCode: form.address.postalCode,
        },
        isPublished: false,
      })
      onComplete()
    } catch (error) {
      console.error("Failed to create experience", error)
      alert("Failed to create experience. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-6">
          <h2 className="text-4xl font-semibold text-center">What experience will you offer guests?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {EXPERIENCE_TYPES.map((item) => (
              <button
                key={item.id}
                onClick={() => setForm((prev) => ({ ...prev, category: item.id }))}
                className={`rounded-2xl border p-6 text-left transition ${form.category === item.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"}`}
              >
                <p className="font-semibold text-lg">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-semibold mb-10">How many years have you worked in {form.category.replace(/_/g, " ")}?</h2>
          <div className="flex items-center justify-center gap-8">
            <button className="size-12 rounded-full border" onClick={() => setForm((prev) => ({ ...prev, yearsOfExperience: Math.max(0, prev.yearsOfExperience - 1) }))}>-</button>
            <p className="text-8xl font-bold">{form.yearsOfExperience}</p>
            <button className="size-12 rounded-full border" onClick={() => setForm((prev) => ({ ...prev, yearsOfExperience: prev.yearsOfExperience + 1 }))}>+</button>
          </div>
        </div>
      )
    }

    if (step === 3) {
      return (
        <div className="max-w-5xl mx-auto space-y-4">
          <h2 className="text-4xl font-semibold text-center">Confirm your location</h2>
          <input
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Location"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3"
          />
          <LocationPickerMap
            mode="search"
            location={form.location}
            coordinates={form.coordinates}
            onLocationChange={(value) => setForm((prev) => ({ ...prev, location: value }))}
            onCoordinatesChange={(value) => setForm((prev) => ({ ...prev, coordinates: value }))}
          />
        </div>
      )
    }

    if (step === 4) {
      return (
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-semibold">Add photos that showcase your skills</h2>
          <p className="text-zinc-600 mt-2 mb-6">Add at least 5 photos.</p>
          <div className="grid grid-cols-3 gap-4">
            {form.images.map((file, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200">
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                <button
                  onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-xl border border-zinc-300 flex items-center justify-center cursor-pointer hover:bg-zinc-50">
              <Plus className="w-8 h-8 text-zinc-500" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setForm((prev) => ({ ...prev, images: [...prev.images, ...files] }))
                }}
              />
            </label>
          </div>
        </div>
      )
    }

    if (step === 5) {
      return (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-semibold text-center mb-8">Your itinerary</h2>
          <div className="space-y-3">
            {form.itinerary.map((item, index) => (
              <div key={index} className="rounded-xl border border-zinc-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-center">
                  <input
                    value={item.title}
                    onChange={(e) => {
                      const next = [...form.itinerary]
                      next[index] = { ...next[index], title: e.target.value }
                      setForm((prev) => ({ ...prev, itinerary: next }))
                    }}
                    placeholder="Activity title"
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  />
                  <input
                    value={item.duration}
                    onChange={(e) => {
                      const next = [...form.itinerary]
                      next[index] = { ...next[index], duration: e.target.value }
                      setForm((prev) => ({ ...prev, itinerary: next }))
                    }}
                    placeholder="Duration"
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  />
                  <input
                    value={item.description}
                    onChange={(e) => {
                      const next = [...form.itinerary]
                      next[index] = { ...next[index], description: e.target.value }
                      setForm((prev) => ({ ...prev, itinerary: next }))
                    }}
                    placeholder="Description"
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => {
                        if (prev.itinerary.length === 1) {
                          return prev
                        }
                        return { ...prev, itinerary: prev.itinerary.filter((_, i) => i !== index) }
                      })
                    }}
                    className="w-10 h-10 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 hover:bg-zinc-50"
                    aria-label="Remove itinerary item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setForm((prev) => ({ ...prev, itinerary: [...prev.itinerary, { title: "", description: "", duration: "1 hr" }] }))}
            className="mt-4 rounded-lg border border-zinc-300 px-4 py-2"
          >
            Add activity
          </button>
        </div>
      )
    }

    if (step === 6) {
      return (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-semibold text-center mb-6">Select available dates</h2>
          <p className="text-zinc-600 text-center mb-6">Add the specific dates guests can book for this experience.</p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <input
              type="date"
              value={newAvailableDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setNewAvailableDate(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => {
                if (!newAvailableDate) return
                setForm((prev) => {
                  const exists = prev.availableDates.includes(newAvailableDate)
                  const nextDates = exists ? prev.availableDates : [...prev.availableDates, newAvailableDate]
                  return { ...prev, availableDates: nextDates.sort() }
                })
                setNewAvailableDate("")
              }}
              className="rounded-lg border border-zinc-300 px-4 py-2"
            >
              Add date
            </button>
          </div>

          {form.availableDates.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {form.availableDates.map((date) => (
                <span key={date} className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700">
                  {new Date(date).toLocaleDateString()}
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, availableDates: prev.availableDates.filter((d) => d !== date) }))}
                    className="text-zinc-500 hover:text-zinc-700"
                    aria-label="Remove date"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (step === 7) {
      return (
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-semibold mb-10">Add your maximum number of guests</h2>
          <div className="flex items-center justify-center gap-8">
            <button className="size-12 rounded-full border" onClick={() => setForm((prev) => ({ ...prev, maxGuests: Math.max(1, prev.maxGuests - 1) }))}>-</button>
            <p className="text-8xl font-bold">{form.maxGuests}</p>
            <button className="size-12 rounded-full border" onClick={() => setForm((prev) => ({ ...prev, maxGuests: prev.maxGuests + 1 }))}>+</button>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-4xl font-semibold text-center">Add your experience title and description</h2>
        <input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Experience title"
          className="w-full rounded-xl border border-zinc-300 px-4 py-3"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what guests will do"
          rows={5}
          className="w-full rounded-xl border border-zinc-300 px-4 py-3"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
            placeholder="Price"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3"
          />
          <input
            value={form.duration}
            onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
            placeholder="Duration (e.g. 3 hours)"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-70 bg-white">
      <div className="h-full flex flex-col">
        <div className="h-16 border-b border-zinc-200 px-6 flex items-center justify-center">
          <p className="text-sm text-zinc-500">Step {step} of 8</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8">{renderStep()}</div>

        <div className="h-20 border-t border-zinc-200 px-6 flex items-center justify-between">
          <button
            onClick={() => setStep((prev) => (Math.max(1, prev - 1) as Step))}
            disabled={step === 1}
            className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold disabled:opacity-40"
          >
            Back
          </button>

          {step < 8 ? (
            <button
              onClick={() => setStep((prev) => (Math.min(8, prev + 1) as Step))}
              disabled={!canContinue}
              className="rounded-xl bg-[#FF5A1F] text-white px-8 py-3 text-sm font-semibold disabled:opacity-40 hover:bg-[#E54F1A]"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canContinue || loading}
              className="rounded-xl bg-[#FF5A1F] text-white px-8 py-3 text-sm font-semibold disabled:opacity-40 flex items-center gap-2 hover:bg-[#E54F1A]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Publish later
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
