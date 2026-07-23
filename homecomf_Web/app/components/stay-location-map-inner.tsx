"use client"

import { useMemo } from "react"
import L from "leaflet"
import { MapContainer, Marker, TileLayer } from "react-leaflet"
import type { StayCoordinates } from "@/app/components/stay-location-map"

interface StayLocationMapInnerProps {
  coordinates: StayCoordinates
  title: string
}

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;border-radius:9999px;background:#f43f5e;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.25);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
})

export default function StayLocationMapInner({ coordinates, title }: StayLocationMapInnerProps) {
  const mapCenter = useMemo(
    () => [coordinates.lat, coordinates.lng] as [number, number],
    [coordinates],
  )

  return (
    <div className="rounded-2xl border border-zinc-200 overflow-hidden h-80">
      <MapContainer center={mapCenter} zoom={14} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={mapCenter} icon={pinIcon} title={title} />
      </MapContainer>
    </div>
  )
}
