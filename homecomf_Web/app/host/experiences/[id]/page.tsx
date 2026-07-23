"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { getMyExperienceById, updateMyExperience } from "@/lib/api/host"
import { ArrowLeft, ChevronRight, X } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/images/logo.png"
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:") || imagePath.startsWith("blob:")) {
    return imagePath
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

interface Experience {
  _id: string
  title: string
  description?: string
  category?: string
  location?: string
  yearsOfExperience?: number
  maxGuests?: number
  itinerary?: Array<{ title?: string; description?: string }>
  images?: string[]
  isPublished?: boolean
}

type EditSection = null | "photos" | "title" | "description" | "location" | "category" | "yearsOfExperience" | "maxGuests" | "itinerary"

export default function HostExperienceEditPage() {
  const params = useParams()
  const [experience, setExperience] = useState<Experience | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editSection, setEditSection] = useState<EditSection>(null)
  const [editData, setEditData] = useState<Record<string, any>>({})

  const loadExperience = async () => {
    try {
      const res = await getMyExperienceById(params.id as string)
      setExperience(res.experience)
    } catch (error) {
      console.error("Failed to load experience", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      loadExperience()
    }
  }, [params.id])

  const handleEditClick = (section: EditSection) => {
    if (!experience) return
    setEditSection(section)
    setEditData({})
  }

  const handleSaveEdit = async () => {
    if (!experience) return

    setIsSaving(true)
    try {
      const response = await updateMyExperience(experience._id, editData)
      setExperience(response.experience)
      setEditSection(null)
      setEditData({})
    } catch (error) {
      console.error("Failed to update experience:", error)
      alert("Failed to update experience. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditSection(null)
    setEditData({})
  }

  const handleSavePublish = async (publish: boolean) => {
    if (!experience) return
    setIsSaving(true)
    try {
      const response = await updateMyExperience(experience._id, {
        isPublished: publish,
      })
      setExperience(response.experience)
    } catch (error) {
      console.error("Failed to save experience:", error)
      alert("Failed to save experience. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Experience not found</p>
          <Link href="/host/experiences" className="text-[#FF5A1F] hover:underline">
            Back to experiences
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - View Only */}
      <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center gap-4 z-10">
          <Link 
            href="/host/experiences"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{experience.title}</h1>
            <p className="text-gray-600 text-sm">{experience.location || "Add location"}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Photos Section */}
          <div 
            onClick={() => handleEditClick("photos")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Photos</h3>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            {experience.images && experience.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {experience.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative h-24 bg-gray-200 rounded overflow-hidden">
                    <Image
                      src={getImageUrl(image)}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No photos added yet</p>
            )}
            {experience.images && experience.images.length > 4 && (
              <p className="mt-2 text-xs text-gray-500">+{experience.images.length - 4} more</p>
            )}
          </div>

          {/* Title Section */}
          <div 
            onClick={() => handleEditClick("title")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Title</h3>
                <p className="text-gray-900 font-medium">{experience.title}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Description Section */}
          <div 
            onClick={() => handleEditClick("description")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Description</h3>
                <p className="text-gray-900 line-clamp-2">{experience.description || "No description"}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 ml-2" />
            </div>
          </div>

          {/* Category Section */}
          <div 
            onClick={() => handleEditClick("category")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Category</h3>
                <p className="text-gray-900 font-medium">{experience.category || "Select category"}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Location Section */}
          <div 
            onClick={() => handleEditClick("location")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Location</h3>
                <p className="text-gray-900 font-medium">{experience.location || "Add location"}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Years of Experience Section */}
          <div 
            onClick={() => handleEditClick("yearsOfExperience")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Experience</h3>
                <p className="text-gray-900 font-medium">{experience.yearsOfExperience || 0} years</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Max Guests Section */}
          <div 
            onClick={() => handleEditClick("maxGuests")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Max Guests</h3>
                <p className="text-gray-900 font-medium">{experience.maxGuests || 0} guests</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Itinerary Section */}
          <div 
            onClick={() => handleEditClick("itinerary")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Itinerary</h3>
                {experience.itinerary && experience.itinerary.length > 0 ? (
                  <p className="text-gray-900">{experience.itinerary.length} activities</p>
                ) : (
                  <p className="text-gray-500 text-sm">No itinerary added</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Edit Form */}
      {editSection ? (
        <div className="w-1/2 bg-gray-50 flex flex-col">
          {/* Edit Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold text-gray-900">
              {editSection === "photos" && "Edit Photos"}
              {editSection === "title" && "Edit Title"}
              {editSection === "description" && "Edit Description"}
              {editSection === "category" && "Edit Category"}
              {editSection === "location" && "Edit Location"}
              {editSection === "yearsOfExperience" && "Years of Experience"}
              {editSection === "maxGuests" && "Max Guests"}
              {editSection === "itinerary" && "Edit Itinerary"}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Edit Form */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {editSection === "photos" && (
              <div className="space-y-4">
                {/* Current Photos */}
                {experience.images && experience.images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Current Photos</label>
                    <div className="grid grid-cols-3 gap-4">
                      {experience.images.map((image: string, index: number) => (
                        <div key={index} className="relative group">
                          <div className="relative h-32 bg-gray-200 rounded-lg overflow-hidden">
                            <Image
                              src={getImageUrl(image)}
                              alt={`Photo ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditData({
                                images: experience.images?.filter((_, i) => i !== index) || [],
                              })
                              handleSaveEdit()
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Add New Photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setEditData({ 
                        images: [...(experience.images || []), ...files] 
                      })
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#FF5A1F] file:text-white
                      hover:file:bg-[#E54F1A]
                      cursor-pointer"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    You can select multiple images at once. JPG, PNG, or GIF (max 8MB each)
                  </p>
                </div>
              </div>
            )}

            {editSection === "title" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Experience Title</label>
                  <input
                    type="text"
                    defaultValue={experience.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    placeholder="Enter a catchy title"
                  />
                </div>
              </div>
            )}

            {editSection === "description" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                  <textarea
                    defaultValue={experience.description || ""}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    placeholder="Describe your experience in detail"
                  />
                </div>
              </div>
            )}

            {editSection === "category" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
                  <select
                    defaultValue={experience.category || ""}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    <option value="Food">Food</option>
                    <option value="Culture">Culture</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Arts">Arts</option>
                    <option value="Nature">Nature</option>
                    <option value="Sports">Sports</option>
                    <option value="Music">Music</option>
                  </select>
                </div>
              </div>
            )}

            {editSection === "location" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
                  <input
                    type="text"
                    defaultValue={experience.location || ""}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>
              </div>
            )}

            {editSection === "yearsOfExperience" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    defaultValue={experience.yearsOfExperience || 0}
                    onChange={(e) => setEditData({ ...editData, yearsOfExperience: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {editSection === "maxGuests" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    defaultValue={experience.maxGuests || 0}
                    onChange={(e) => setEditData({ ...editData, maxGuests: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {editSection === "itinerary" && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {(editData.itinerary || experience.itinerary || []).map((item: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-2">
                      <input
                        type="text"
                        placeholder="Activity title"
                        defaultValue={item?.title || ""}
                        onChange={(e) => {
                          const newItinerary = [...(editData.itinerary || experience.itinerary || [])]
                          newItinerary[index] = { ...newItinerary[index], title: e.target.value }
                          setEditData({ ...editData, itinerary: newItinerary })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                      />
                      <textarea
                        placeholder="Activity description"
                        defaultValue={item?.description || ""}
                        onChange={(e) => {
                          const newItinerary = [...(editData.itinerary || experience.itinerary || [])]
                          newItinerary[index] = { ...newItinerary[index], description: e.target.value }
                          setEditData({ ...editData, itinerary: newItinerary })
                        }}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                      />
                      <button
                        onClick={() => {
                          const newItinerary = (editData.itinerary || experience.itinerary || []).filter((_: any, i: number) => i !== index)
                          setEditData({ ...editData, itinerary: newItinerary })
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Activity
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const newItinerary = [...(editData.itinerary || experience.itinerary || []), { title: "", description: "" }]
                    setEditData({ ...editData, itinerary: newItinerary })
                  }}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  + Add Activity
                </button>
              </div>
            )}
          </div>

          {/* Footer with Save/Cancel */}
          <div className="border-t border-gray-200 bg-white px-8 py-4 flex items-center gap-3 justify-end">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="px-6 py-2 bg-[#FF5A1F] text-white rounded-lg text-sm font-semibold hover:bg-[#E54F1A] transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-1/2 bg-gray-50 border-l border-gray-200 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <p className="text-gray-600">Select a section on the left to edit</p>
          </div>

          {/* Publish/Draft Buttons */}
          <div className="fixed bottom-8 right-8 flex gap-3">
            <button
              onClick={() => handleSavePublish(false)}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSavePublish(true)}
              disabled={isSaving}
              className="rounded-lg bg-[#FF5A1F] text-white px-6 py-2 text-sm font-semibold hover:bg-[#E54F1A] transition-colors disabled:opacity-50"
            >
              {experience.isPublished ? "Published" : "Publish"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
