"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

export type Coordinates = {
  lat: number
  lng: number
}

interface LocationPickerMapProps {
  mode: "search" | "confirm"
  location: string
  coordinates: Coordinates
  onLocationChange: (value: string) => void
  onCoordinatesChange: (value: Coordinates) => void
}

const LocationPickerMapInner = dynamic<LocationPickerMapProps>(
  () => import("./location-picker-map-inner"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl border border-zinc-200 overflow-hidden h-115 relative bg-zinc-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    ),
  },
)

export default function LocationPickerMap(props: LocationPickerMapProps) {
  return <LocationPickerMapInner {...props} />
}
