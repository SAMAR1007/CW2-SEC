"use client";

import { useEffect, useRef, useState } from 'react';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  readonly?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function LocationEditMap({ 
  latitude, 
  longitude, 
  readonly = false,
  onLocationChange 
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load Leaflet dynamically
    if (!window.L) {
      const leafletCtx = require('leaflet');
      window.L = leafletCtx;
    }

    if (!mapContainer.current || map.current) return;

    try {
      const L = window.L;

      // Initialize map
      map.current = L.map(mapContainer.current, {
        center: [latitude, longitude],
        zoom: 15,
        scrollWheelZoom: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Create custom marker icon
      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 40px;
          height: 40px;
          background: #FF5A1F;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: ${readonly ? 'default' : 'grab'};
        ">📍</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      // Add marker
      marker.current = L.marker([latitude, longitude], { 
        icon: markerIcon,
        draggable: !readonly
      }).addTo(map.current);

      // Handle marker drag
      if (!readonly && marker.current && onLocationChange) {
        marker.current.on('dragend', (e: any) => {
          const latlng = e.target.getLatLng();
          onLocationChange(latlng.lat, latlng.lng);
        });
      }

      // Handle map click
      if (!readonly && onLocationChange) {
        map.current.on('click', (e: any) => {
          marker.current.setLatLng(e.latlng);
          onLocationChange(e.latlng.lat, e.latlng.lng);
        });
      }

      // Fix map sizing
      setTimeout(() => {
        map.current?.invalidateSize();
      }, 100);

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      // Don't remove map on unmount to prevent reinitialization issues
    };
  }, []);

  // Update marker when props change
  useEffect(() => {
    if (marker.current && map.current && window.L) {
      marker.current.setLatLng([latitude, longitude]);
      map.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude]);

  return (
    <div 
      ref={mapContainer} 
      style={{
        width: '100%',
        height: '100%',
        minHeight: '300px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      className="relative"
    />
  );
}

