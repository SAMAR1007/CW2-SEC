"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getMyListingById, updateMyListing } from "@/lib/api/host";
import { Loader2, ArrowLeft, ChevronRight, X, MapPin, Map } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const AMENITY_OPTIONS = [
  { id: "wifi", label: "Wifi" },
  { id: "tv", label: "TV" },
  { id: "kitchen", label: "Kitchen" },
  { id: "washer", label: "Washer" },
  { id: "free_parking", label: "Free parking on premises" },
  { id: "paid_parking", label: "Paid parking on premises" },
  { id: "ac", label: "Air conditioning" },
  { id: "workspace", label: "Dedicated workspace" },
] as const;

const AMENITY_LABELS = AMENITY_OPTIONS.reduce<Record<string, string>>((acc, amenity) => {
  acc[amenity.id] = amenity.label;
  return acc;
}, {});

const formatAmenityLabel = (amenityId: string) => {
  return AMENITY_LABELS[amenityId] || amenityId.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "/images/logo.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:") || imagePath.startsWith("blob:")) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

interface Listing {
  _id: string;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
  price: number;
  weekendPrice?: number;
  weekendPremium?: number;
  description?: string;
  highlights?: string[];
  amenities?: string[];
  standoutAmenities?: string[];
  safetyItems?: string[];
  images: string[];
  isPublished: boolean;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  bookingType?: 'instant';
  showExactLocation?: boolean;
  residentialAddress?: {
    country: string;
    street: string;
    apt: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

interface LocationSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Dynamic import for map component
const LocationEditMap = dynamic(() => import('./location-map'), { 
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse" />
});

type EditSection = null | "title" | "location" | "description" | "pricing" | "rooms" | "booking" | "amenities" | "address" | "photos";

export default function ListingDetailPage() {
  const params = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [resolvedMapAddress, setResolvedMapAddress] = useState<string>("");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSearchResults, setLocationSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState("");
  const [locationSearchInfo, setLocationSearchInfo] = useState("");
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await getMyListingById(params.id as string);
        setListing(response.listing);
      } catch (error) {
        console.error("Failed to fetch listing:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchListing();
    }
  }, [params.id]);

  const handleEditClick = (section: EditSection) => {
    if (!listing) return;
    setEditSection(section);
    
    // Initialize editData based on section
    if (section === "photos") {
      setEditData({ images: listing.images || [] });
    } else {
      setEditData({});
    }
    
    setResolvedMapAddress("");
    setLocationSearchQuery(listing.location || "");
    setLocationSearchResults([]);
    setLocationSearchError("");
    setLocationSearchInfo("");
  };

  const handleLocationSearch = async () => {
    const query = locationSearchQuery.trim();
    if (query.length < 3) {
      setLocationSearchResults([]);
      setLocationSearchError("Please enter at least 3 characters to search.");
      setLocationSearchInfo("");
      return;
    }

    try {
      setIsSearchingLocation(true);
      setLocationSearchError("");
      setLocationSearchInfo("");
      const response = await fetch(`/api/geocode?type=search&q=${encodeURIComponent(query)}&limit=5`);

      if (!response.ok) {
        throw new Error(`Failed to search locations (${response.status})`);
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : [];

      if (results.length === 0) {
        setLocationSearchResults([]);
        setLocationSearchError("No locations found from current providers. Try adding city/country in your search.");
        setLocationSearchInfo("");
        return;
      }

      setLocationSearchResults(results);
      await handleSelectSearchResult(results[0]);
      setLocationSearchInfo("Top search result selected. You can refine and search again if needed.");
    } catch (error) {
      console.error("Failed to search location:", error);
      setLocationSearchResults([]);
      setLocationSearchError("Search failed. Please try again.");
      setLocationSearchInfo("");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectSearchResult = async (result: LocationSearchResult) => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    setLocationSearchQuery(result.display_name);
    setLocationSearchResults([]);
    setLocationSearchError("");
    setResolvedMapAddress(result.display_name);
    setEditData((prev) => ({ ...prev, latitude: lat, longitude: lng, location: result.display_name }));

    await handleMapLocationChange(lat, lng);
  };

  const handleUseCurrentLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationSearchError("Current location is not supported by this browser.");
      setLocationSearchInfo("");
      return;
    }

    if (typeof navigator.permissions !== "undefined") {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        if (permission.state === "denied") {
          setLocationSearchError("Location access is blocked. Please turn on location and allow access in browser settings.");
          setLocationSearchInfo("");
          return;
        }
      } catch {
      }
    }

    setIsGettingCurrentLocation(true);
    setLocationSearchError("");
    setLocationSearchInfo("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setEditData((prev) => ({ ...prev, latitude, longitude }));
        await handleMapLocationChange(latitude, longitude);
        setLocationSearchInfo("Current location selected.");
        setIsGettingCurrentLocation(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Please allow location access in browser settings."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Location services seem to be off. Please turn on device location and try again."
              : "Unable to get current location. Please ensure location is on and try again.";
        setLocationSearchError(message);
        setLocationSearchInfo("");
        setIsGettingCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleMapLocationChange = useCallback(
    async (lat: number, lng: number) => {
      setEditData((prev) => ({ ...prev, latitude: lat, longitude: lng }));

      try {
        setIsResolvingLocation(true);
        const response = await fetch(`/api/geocode?type=reverse&lat=${lat}&lon=${lng}`);

        if (!response.ok) {
          throw new Error("Failed to reverse geocode location");
        }

        const data = await response.json();
        const address = data?.address || {};
        const displayName = data?.display_name || "";
        const locationName = [address.city || address.town || address.village, address.state, address.country]
          .filter(Boolean)
          .join(", ");

        setEditData((prev) => ({
          ...prev,
          location: displayName || locationName || prev.location || listing?.location || "",
          residentialAddress: {
            ...(listing?.residentialAddress || {}),
            ...(prev.residentialAddress || {}),
            street: address.road || prev.residentialAddress?.street || listing?.residentialAddress?.street || "",
            city: address.city || address.town || address.village || prev.residentialAddress?.city || listing?.residentialAddress?.city || "",
            province: address.state || prev.residentialAddress?.province || listing?.residentialAddress?.province || "",
            postalCode: address.postcode || prev.residentialAddress?.postalCode || listing?.residentialAddress?.postalCode || "",
            country: address.country || prev.residentialAddress?.country || listing?.residentialAddress?.country || "",
            apt: prev.residentialAddress?.apt || listing?.residentialAddress?.apt || "",
          },
        }));

        setResolvedMapAddress(displayName);
        setLocationSearchQuery(displayName || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      } catch (error) {
        console.error("Failed to resolve selected map location:", error);
        setResolvedMapAddress("");
      } finally {
        setIsResolvingLocation(false);
      }
    },
    [listing]
  );

  const selectedAmenities = Array.isArray(editData.amenities)
    ? editData.amenities
    : listing?.amenities || [];

  const toggleAmenity = (amenityId: string) => {
    setEditData((prev) => {
      const currentAmenities = Array.isArray(prev.amenities) ? prev.amenities : listing?.amenities || [];
      const hasAmenity = currentAmenities.includes(amenityId);

      return {
        ...prev,
        amenities: hasAmenity
          ? currentAmenities.filter((item: string) => item !== amenityId)
          : [...currentAmenities, amenityId],
      };
    });
  };

  const handleSaveEdit = async () => {
    if (!listing) return;

    const payload =
      editSection === "location"
        ? {
            ...editData,
            location: resolvedMapAddress || editData.location || listing.location,
          }
        : editData;
    
    setIsSaving(true);
    try {
      const response = await updateMyListing(listing._id, payload);
      setListing(response.listing);
      setEditSection(null);
      setEditData({});
      setResolvedMapAddress("");
      setLocationSearchResults([]);
      setLocationSearchError("");
      setLocationSearchInfo("");
    } catch (error) {
      console.error("Failed to update listing:", error);
      alert("Failed to update listing. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditSection(null);
    setEditData({});
    setResolvedMapAddress("");
    setLocationSearchResults([]);
    setLocationSearchError("");
    setLocationSearchInfo("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF5A1F]" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Listing not found</p>
          <Link href="/host/listings" className="text-[#FF5A1F] hover:underline">
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - View Only */}
      <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center gap-4 z-10">
          <Link 
            href="/host/listings"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{listing.title}</h1>
            <p className="text-gray-600 text-sm">{listing.location}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Photos - Editable Section */}
          <div 
            onClick={() => handleEditClick("photos")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Photos</h3>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            {listing.images && listing.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {listing.images.slice(0, 4).map((image, index) => (
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
            {listing.images && listing.images.length > 4 && (
              <p className="mt-2 text-xs text-gray-500">+{listing.images.length - 4} more</p>
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
                <p className="text-gray-900 font-medium">{listing.title}</p>
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
                <h3 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Location
                </h3>
                <p className="text-gray-900 font-medium">{listing.location || "Add location"}</p>
                {listing.residentialAddress && (
                  <p className="text-gray-600 text-xs mt-1">
                    {listing.residentialAddress.city}, {listing.residentialAddress.country}
                  </p>
                )}
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
                <p className="text-gray-900 line-clamp-2">{listing.description || "No description"}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 ml-2" />
            </div>
          </div>

          {/* Pricing Section */}
          <div 
            onClick={() => handleEditClick("pricing")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Pricing</h3>
                <div className="space-y-1">
                  <p className="text-gray-900">Base: <span className="font-medium">Rs. {listing.price}</span>/night</p>
                  {listing.weekendPrice ? (
                    <p className="text-gray-900">Weekend: <span className="font-medium">Rs. {listing.weekendPrice}</span>/night</p>
                  ) : null}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Rooms Section */}
          <div 
            onClick={() => handleEditClick("rooms")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Rooms & Spaces</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-900">{listing.maxGuests} guests</p>
                  <p className="text-gray-900">{listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''}</p>
                  <p className="text-gray-900">{listing.beds} bed{listing.beds !== 1 ? 's' : ''}</p>
                  <p className="text-gray-900">{listing.bathrooms} bathroom{listing.bathrooms !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div 
              onClick={() => handleEditClick("amenities")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {formatAmenityLabel(amenity)}
                      </span>
                    ))}
                    {listing.amenities.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        +{listing.amenities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 ml-2" />
              </div>
            </div>
          )}

          {/* Address */}
          {listing.residentialAddress && (
            <div 
              onClick={() => handleEditClick("address")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Address</h3>
                  <p className="text-gray-900 text-sm line-clamp-2">
                    {listing.residentialAddress.street}, {listing.residentialAddress.city}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 ml-2" />
              </div>
            </div>
          )}

          {/* Status */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Status</h3>
                <p className={`font-medium ${listing.isPublished ? 'text-green-600' : 'text-amber-600'}`}>
                  {listing.isPublished ? 'Published' : 'Not Published'}
                </p>
              </div>
              <button
                onClick={() => handleEditClick("booking")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  listing.isPublished
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-[#FF5A1F] text-white hover:bg-[#E54D15]'
                }`}
              >
                {listing.isPublished ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Edit Form */}
      {editSection ? (
        <div className="w-1/2 bg-gray-50 flex flex-col">
          {/* Edit Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editSection === "title" && "Edit Title"}
              {editSection === "location" && "Edit Location"}
              {editSection === "description" && "Edit Description"}
              {editSection === "pricing" && "Edit Pricing"}
              {editSection === "rooms" && "Edit Rooms & Spaces"}
              {editSection === "booking" && "Edit Booking Type"}
              {editSection === "amenities" && "Edit Amenities"}
              {editSection === "address" && "Edit Address"}
              {editSection === "photos" && "Edit Photos"}
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
                {editData.images && editData.images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Current Photos</label>
                    <div className="grid grid-cols-3 gap-4">
                      {editData.images.map((image: string | File, index: number) => (
                        <div key={index} className="relative group">
                          <div className="relative h-32 bg-gray-200 rounded-lg overflow-hidden">
                            <Image
                              src={typeof image === 'string' ? getImageUrl(image) : URL.createObjectURL(image)}
                              alt={`Photo ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = editData.images.filter((_: any, i: number) => i !== index);
                              setEditData({ ...editData, images: newImages });
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
                      const files = Array.from(e.target.files || []);
                      setEditData({ 
                        ...editData, 
                        images: [...(editData.images || []), ...files] 
                      });
                      e.target.value = ''; // Reset input
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
                  <label className="block text-sm font-medium text-gray-900 mb-2">Listing Title</label>
                  <input
                    type="text"
                    defaultValue={listing.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    placeholder="Enter a catchy title"
                  />
                </div>
              </div>
            )}

            {editSection === "location" && (
              <div className="space-y-6 divide-y">
                {/* Map */}
                <div className="pb-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Adjust Location on Map</h4>
                    <p className="text-xs text-gray-600 mb-3">Drag the marker to set exact location or click anywhere on the map</p>
                  </div>
                  <div className="mb-4 relative">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleLocationSearch();
                          }
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                        placeholder="Search address or place"
                      />
                      <button
                        type="button"
                        onClick={handleLocationSearch}
                        disabled={isSearchingLocation || isGettingCurrentLocation}
                        className="px-4 py-3 bg-[#FF5A1F] text-white rounded-lg hover:bg-[#E54D15] transition-colors disabled:opacity-50"
                      >
                        {isSearchingLocation ? "Searching..." : "Search"}
                      </button>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isSearchingLocation || isGettingCurrentLocation}
                        className="px-4 py-3 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {isGettingCurrentLocation ? "Locating..." : "Use Current Location"}
                      </button>
                    </div>

                    {locationSearchResults.length > 0 && (
                      <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-sm max-h-56 overflow-y-auto">
                        {locationSearchResults.map((result) => (
                          <button
                            key={result.place_id}
                            type="button"
                            onClick={() => handleSelectSearchResult(result)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            {result.display_name}
                          </button>
                        ))}
                      </div>
                    )}

                    {locationSearchError ? (
                      <p className="mt-2 text-xs text-red-600">{locationSearchError}</p>
                    ) : locationSearchInfo ? (
                      <p className="mt-2 text-xs text-gray-600">{locationSearchInfo}</p>
                    ) : null}
                  </div>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden h-64">
                    <LocationEditMap 
                      latitude={editData.latitude || listing.latitude || 27.7172}
                      longitude={editData.longitude || listing.longitude || 85.3240}
                      onLocationChange={handleMapLocationChange}
                      readonly={false}
                    />
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Coordinates: {(editData.latitude || listing.latitude || 27.7172).toFixed(4)}, {(editData.longitude || listing.longitude || 85.3240).toFixed(4)}</p>
                    <p className="mt-1">
                      Selected address: {isResolvingLocation ? "Updating address..." : resolvedMapAddress || editData.location || listing.location || "Not available"}
                    </p>
                  </div>
                </div>

                {/* Location Name */}
                <div className="pt-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Location Name</label>
                  <input
                    type="text"
                    value={editData.location ?? listing.location ?? ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    placeholder="e.g., Kathmandu, Thamel"
                  />
                  <p className="text-xs text-gray-600 mt-2">This appears in your listing header and search results</p>
                </div>

                {/* Address */}
                <div className="pt-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Street</label>
                      <input
                        type="text"
                        value={editData.residentialAddress?.street ?? listing.residentialAddress?.street ?? ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            residentialAddress: {
                              ...(listing.residentialAddress || {}),
                              ...(prev.residentialAddress || {}),
                              street: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={editData.residentialAddress?.city ?? listing.residentialAddress?.city ?? ""}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              residentialAddress: {
                                ...(listing.residentialAddress || {}),
                                ...(prev.residentialAddress || {}),
                                city: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Province</label>
                        <input
                          type="text"
                          value={editData.residentialAddress?.province ?? listing.residentialAddress?.province ?? ""}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              residentialAddress: {
                                ...(listing.residentialAddress || {}),
                                ...(prev.residentialAddress || {}),
                                province: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
                        <input
                          type="text"
                          value={editData.residentialAddress?.postalCode ?? listing.residentialAddress?.postalCode ?? ""}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              residentialAddress: {
                                ...(listing.residentialAddress || {}),
                                ...(prev.residentialAddress || {}),
                                postalCode: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          value={editData.residentialAddress?.country ?? listing.residentialAddress?.country ?? ""}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              residentialAddress: {
                                ...(listing.residentialAddress || {}),
                                ...(prev.residentialAddress || {}),
                                country: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {editSection === "description" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                  <textarea
                    defaultValue={listing.description || ""}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent resize-none"
                    placeholder="Describe your space to guests"
                  />
                </div>
              </div>
            )}

            {editSection === "pricing" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Base Price per Night</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium">Rs.</span>
                    <input
                      type="number"
                      defaultValue={listing.price}
                      onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Weekend Price per Night (Optional)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium">Rs.</span>
                    <input
                      type="number"
                      defaultValue={listing.weekendPrice || 0}
                      onChange={(e) => setEditData({ ...editData, weekendPrice: parseFloat(e.target.value) })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Weekly Discount (%) (Optional)</label>
                  <input
                    type="number"
                    defaultValue={listing.weekendPremium || 0}
                    onChange={(e) => setEditData({ ...editData, weekendPremium: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            )}

            {editSection === "rooms" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Guests</label>
                  <input
                    type="number"
                    defaultValue={listing.maxGuests}
                    onChange={(e) => setEditData({ ...editData, maxGuests: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Bedrooms</label>
                  <input
                    type="number"
                    defaultValue={listing.bedrooms}
                    onChange={(e) => setEditData({ ...editData, bedrooms: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Beds</label>
                  <input
                    type="number"
                    defaultValue={listing.beds}
                    onChange={(e) => setEditData({ ...editData, beds: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Bathrooms</label>
                  <input
                    type="number"
                    defaultValue={listing.bathrooms}
                    onChange={(e) => setEditData({ ...editData, bathrooms: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>
            )}

            {editSection === "booking" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Publish Status</label>
                  <select
                    defaultValue={listing.isPublished ? "published" : "unpublished"}
                    onChange={(e) => setEditData({ ...editData, isPublished: e.target.value === "published" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                  >
                    <option value="published">Published</option>
                    <option value="unpublished">Not Published</option>
                  </select>
                </div>
              </div>
            )}

            {editSection === "amenities" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Select Amenities</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AMENITY_OPTIONS.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                            isSelected
                              ? "border-[#FF5A1F] bg-[#FFF1EB] text-[#C74312]"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {amenity.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Current Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAmenities.length > 0 ? (
                      selectedAmenities.map((amenity: string) => (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className="bg-[#FF5A1F] text-white px-3 py-1 rounded-full text-sm hover:bg-[#E54D15] transition-colors"
                        >
                          {formatAmenityLabel(amenity)}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">No amenities selected.</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-3">Click a selected amenity to remove it.</p>
                </div>
              </div>
            )}

            {editSection === "address" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Street</label>
                  <input
                    type="text"
                    defaultValue={listing.residentialAddress?.street || ""}
                    onChange={(e) => setEditData({ ...editData, residentialAddress: { ...listing.residentialAddress, ...editData.residentialAddress, street: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">City</label>
                  <input
                    type="text"
                    defaultValue={listing.residentialAddress?.city || ""}
                    onChange={(e) => setEditData({ ...editData, residentialAddress: { ...listing.residentialAddress, ...editData.residentialAddress, city: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Province</label>
                  <input
                    type="text"
                    defaultValue={listing.residentialAddress?.province || ""}
                    onChange={(e) => setEditData({ ...editData, residentialAddress: { ...listing.residentialAddress, ...editData.residentialAddress, province: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Postal Code</label>
                  <input
                    type="text"
                    defaultValue={listing.residentialAddress?.postalCode || ""}
                    onChange={(e) => setEditData({ ...editData, residentialAddress: { ...listing.residentialAddress, ...editData.residentialAddress, postalCode: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Country</label>
                  <input
                    type="text"
                    defaultValue={listing.residentialAddress?.country || ""}
                    onChange={(e) => setEditData({ ...editData, residentialAddress: { ...listing.residentialAddress, ...editData.residentialAddress, country: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white border-t border-gray-200 px-8 py-4 flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="px-6 py-2 bg-[#FF5A1F] text-white rounded-lg hover:bg-[#E54D15] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="w-1/2 bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500 text-center">Click on any section to edit</p>
        </div>
      )}
    </div>
  );
}
