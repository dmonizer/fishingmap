"use client";

import { useEffect } from "react";
import { CircleMarker, useMap } from "react-leaflet";
import type { GeoPosition } from "@/lib/useGeolocation";

type UserLocationLayerProps = {
  position: GeoPosition | null;
  following: boolean;
};

const LOCATION_STYLE = {
  color: "#ffffff",
  fillColor: "#1e88e5",
  fillOpacity: 1,
  weight: 2,
};

/**
 * Renders the user's current position and, while "following" is enabled, keeps
 * the map centered on it as the device location updates.
 */
export default function UserLocationLayer({
  position,
  following,
}: UserLocationLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (following && position) {
      map.panTo([position.lat, position.lng]);
    }
  }, [following, position, map]);

  if (!position) return null;

  return (
    <CircleMarker
      center={[position.lat, position.lng]}
      radius={8}
      pathOptions={LOCATION_STYLE}
    />
  );
}
