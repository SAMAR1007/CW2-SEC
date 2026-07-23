"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, MapPin } from "lucide-react"
import L from "leaflet"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import type { Coordinates } from "@/components/location-picker-map"

interface LocationPickerMapInnerProps {
  mode: "search" | "confirm"
  location: string
  coordinates: Coordinates
  onLocationChange: (value: string) => void
  onCoordinatesChange: (value: Coordinates) => void
}

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;border-radius:9999px;background:#f43f5e;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.25);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

function MapUpdater({ center }: { center: Coordinates }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 0.4 })
  }, [center, map])

  return null
}

function SearchMarker({
  coordinates,
  onCoordinatesChange,
  onReverseGeocode,
}: {
  coordinates: Coordinates
  onCoordinatesChange: (value: Coordinates) => void
  onReverseGeocode: (lat: number, lng: number) => Promise<void>
}) {
  return (
    <Marker
      position={[coordinates.lat, coordinates.lng]}
      draggable
      icon={pinIcon}
      eventHandlers={{
        dragend: async (event) => {
          const marker = event.target
          const latLng = marker.getLatLng()
          onCoordinatesChange({ lat: latLng.lat, lng: latLng.lng })
          await onReverseGeocode(latLng.lat, latLng.lng)
        },
      }}
    />
  )
}

function ConfirmMapEvents({
  onCoordinatesChange,
  onReverseGeocode,
}: {
  onCoordinatesChange: (value: Coordinates) => void
  onReverseGeocode: (lat: number, lng: number) => Promise<void>
}) {
  const map = useMapEvents({
    moveend: async () => {
      const center = map.getCenter()
      onCoordinatesChange({ lat: center.lat, lng: center.lng })
      await onReverseGeocode(center.lat, center.lng)
    },
  })

  return null
}

export default function LocationPickerMapInner({
  mode,
  location,
  coordinates,
  onLocationChange,
  onCoordinatesChange,
}: LocationPickerMapInnerProps) {
  const [query, setQuery] = useState(location)
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false)
  const [currentLocationError, setCurrentLocationError] = useState("")
  const [currentLocationInfo, setCurrentLocationInfo] = useState("")

  useEffect(() => {
    setQuery(location)
  }, [location])

  const mapCenter = useMemo(() => [coordinates.lat, coordinates.lng] as [number, number], [coordinates])

  const reverseGeocode = async (lat: number, lng: number) => {
    setResolving(true)
    try {
      const response = await fetch(
        `/api/geocode?type=reverse&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`,
      )
      if (!response.ok) return
      const data = await response.json()
      if (data?.display_name) {
        onLocationChange(data.display_name)
        setQuery(data.display_name)
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error)
    } finally {
      setResolving(false)
    }
  }

  const searchAddress = async () => {
    const value = query.trim()
    if (!value) return

    setSearching(true)
    try {
      const response = await fetch(
        `/api/geocode?type=search&limit=1&q=${encodeURIComponent(value)}`,
      )
      if (!response.ok) return
      const data = await response.json()
      if (!Array.isArray(data) || data.length === 0) return

      const hit = data[0]
      const next = { lat: Number(hit.lat), lng: Number(hit.lon) }
      onCoordinatesChange(next)
      onLocationChange(hit.display_name || value)
      setQuery(hit.display_name || value)
    } catch (error) {
      console.error("Address search failed", error)
    } finally {
      setSearching(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    setCurrentLocationError("")
    setCurrentLocationInfo("")

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setCurrentLocationError("Current location is not supported by this browser.")
      return
    }

    if (typeof navigator.permissions !== "undefined") {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName })
        if (permission.state === "denied") {
          setCurrentLocationError("Location access is blocked. Please turn on location and allow access in browser settings.")
          return
        }
      } catch {
      }
    }

    setGettingCurrentLocation(true)
    setCurrentLocationInfo("Getting your current location...")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        onCoordinatesChange({ lat: latitude, lng: longitude })
        await reverseGeocode(latitude, longitude)
        setCurrentLocationInfo("Current location selected.")
        setGettingCurrentLocation(false)
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Please allow access in your browser settings."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Location services seem to be off. Please turn on device location and try again."
              : "Unable to get current location. Please ensure location is on and try again."
        setCurrentLocationError(message)
        setCurrentLocationInfo("")
        console.error("Error getting current location", error)
        setGettingCurrentLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  return (
    <div className="rounded-3xl border border-zinc-200 overflow-hidden h-115 relative bg-zinc-100">
      {mode === "search" ? (
        <>
          <div className="absolute top-6 left-6 right-6 bg-white rounded-full px-5 py-4 shadow-md flex items-center gap-3 z-500">
            <MapPin className="w-5 h-5 text-zinc-900" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={searchAddress}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  searchAddress()
                }
              }}
              placeholder="Enter your address"
              className="w-full text-lg bg-transparent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={gettingCurrentLocation}
              className="text-xs font-medium px-3 py-1 rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {gettingCurrentLocation ? "Locating..." : "Use current location"}
            </button>
            {(searching || resolving) && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
          </div>

          {(currentLocationError || currentLocationInfo) && (
            <div className="absolute top-24 left-6 right-6 z-500">
              <div
                className={`rounded-xl px-3 py-2 text-xs sm:text-sm border ${
                  currentLocationError
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-zinc-50 text-zinc-700 border-zinc-200"
                }`}
              >
                {currentLocationError || currentLocationInfo}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute top-6 left-6 right-6 bg-white rounded-full px-5 py-4 shadow-md flex items-center gap-3 z-500">
          <MapPin className="w-5 h-5 text-zinc-900" />
          <p className="text-lg text-zinc-900 truncate">{location || "Move map to set location"}</p>
          {resolving && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
        </div>
      )}

      <MapContainer center={mapCenter} zoom={14} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={coordinates} />

        {mode === "search" ? (
          <SearchMarker
            coordinates={coordinates}
            onCoordinatesChange={onCoordinatesChange}
            onReverseGeocode={reverseGeocode}
          />
        ) : (
          <ConfirmMapEvents onCoordinatesChange={onCoordinatesChange} onReverseGeocode={reverseGeocode} />
        )}
      </MapContainer>

      {mode === "confirm" && (
        <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-450">
            <div className="w-12 h-12 rounded-full bg-rose-500 border-4 border-white shadow-xl" />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#FF5A1F] text-white rounded-full px-5 py-2 text-sm font-medium z-500">
            Drag the map to reposition the pin
          </div>
        </>
      )}
    </div>
  )
}
