"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import ExperienceCreationWizard from "@/components/experience-creation-wizard"
import { getMyExperiences } from "@/lib/api/host"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/images/logo.png"
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

type HostExperiencesPageProps = {
  onNavigate: (page: "hostListings") => void
}

export default function HostExperiencesPage({ onNavigate }: HostExperiencesPageProps) {
  const [showWizard, setShowWizard] = useState(false)
  const [experiences, setExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await getMyExperiences()
      setExperiences(Array.isArray(res?.experiences) ? res.experiences : [])
    } catch (error) {
      console.error("Failed to fetch experiences", error)
      setExperiences([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Your hosting</h1>
            <p className="text-gray-600 mt-2">Switch between stays and experiences</p>
          </div>
          <Link href="/host/create" className="rounded-lg bg-[#FF5A1F] text-white px-4 py-2 text-sm font-semibold hover:bg-[#E54F1A]">
            Create
          </Link>
        </div>

        <div className="mb-6 inline-flex rounded-full bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => onNavigate("hostListings")}
            className="px-4 py-2 rounded-full text-sm font-medium text-zinc-700"
          >
            Stays
          </button>
          <span className="px-4 py-2 rounded-full text-sm font-medium bg-white text-zinc-900">Experiences</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-zinc-500">Loading experiences...</div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">You haven't created any experiences yet.</p>
            <button onClick={() => setShowWizard(true)} className="mt-4 rounded-lg bg-[#FF5A1F] text-white px-4 py-2 text-sm font-semibold hover:bg-[#E54F1A]">
              Host an experience
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((experience) => (
              <Link key={experience._id} href={`/host/experiences/${experience._id}`} className="group cursor-pointer">
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative w-full h-64 bg-gray-200">
                    <img
                      src={getImageUrl(experience.images?.[0])}
                      alt={experience.title}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = "/images/logo.png"
                      }}
                    />
                    {!experience.isPublished && (
                      <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-full shadow-md">
                        <span className="text-sm font-medium text-gray-900">Action required</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#FF5A1F] transition-colors">{experience.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{experience.location}</p>
                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-gray-900 font-semibold">Rs. {experience.price}</span>
                      <span className="text-gray-500 text-sm">/ person</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showWizard && (
        <ExperienceCreationWizard
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false)
            load()
          }}
        />
      )}
    </div>
  )
}
