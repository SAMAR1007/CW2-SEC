import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const ARCGIS_BASE_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

async function searchNominatim(query: string, limit: string): Promise<SearchResult[]> {
  const response = await fetch(
    `${NOMINATIM_BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=1&limit=${encodeURIComponent(limit)}`,
    {
      headers: {
        "Accept": "application/json",
        "User-Agent": "homecomf-host-location-editor/1.0",
      },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function searchArcGis(query: string, limit: string): Promise<SearchResult[]> {
  const response = await fetch(
    `${ARCGIS_BASE_URL}/findAddressCandidates?f=pjson&singleLine=${encodeURIComponent(query)}&maxLocations=${encodeURIComponent(limit)}`,
    {
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];

  return candidates.map((candidate: any, index: number) => ({
    place_id: Number(candidate?.attributes?.ResultID) || Number(candidate?.attributes?.Loc_name) || Date.now() + index,
    display_name: candidate?.address || "Unknown location",
    lat: String(candidate?.location?.y ?? ""),
    lon: String(candidate?.location?.x ?? ""),
  })).filter((item: SearchResult) => item.lat && item.lon);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    if (type === "reverse") {
      const lat = searchParams.get("lat");
      const lon = searchParams.get("lon");

      if (!lat || !lon) {
        return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
      }

      const response = await fetch(
        `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        {
          headers: {
            "Accept": "application/json",
            "User-Agent": "homecomf-host-location-editor/1.0",
          },
          next: { revalidate: 0 },
        }
      );

      if (!response.ok) {
        return NextResponse.json({ error: "Reverse geocoding failed" }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    }

    if (type === "search") {
      const query = searchParams.get("q");
      const limit = searchParams.get("limit") || "5";

      if (!query) {
        return NextResponse.json({ error: "Missing search query" }, { status: 400 });
      }

      const normalizedQuery = query.trim();

      let results = await searchNominatim(normalizedQuery, limit);

      if (results.length === 0 && !normalizedQuery.toLowerCase().includes("nepal")) {
        results = await searchNominatim(`${normalizedQuery}, Nepal`, limit);
      }

      if (results.length === 0) {
        results = await searchArcGis(normalizedQuery, limit);
      }

      return NextResponse.json(results, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid geocode type" }, { status: 400 });
  } catch (error) {
    console.error("Geocode API error:", error);
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 500 });
  }
}
