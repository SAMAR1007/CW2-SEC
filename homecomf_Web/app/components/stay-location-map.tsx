"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

export interface StayCoordinates {
  lat: number
  lng: number
}

interface StayLocationMapProps {
  coordinates: StayCoordinates
  title: string
}

const StayLocationMapInner = dynamic<StayLocationMapProps>(
  () => import("./stay-location-map-inner"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-zinc-200 overflow-hidden h-80 bg-zinc-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    ),
  },
)

export default function StayLocationMap(props: StayLocationMapProps) {
  return <StayLocationMapInner {...props} />
}
