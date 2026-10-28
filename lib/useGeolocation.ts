"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeoPosition = {
  lat: number;
  lng: number;
  accuracy: number;
};

export type GeolocationStatus =
  | "idle"
  | "pending"
  | "granted"
  | "denied"
  | "unavailable"
  | "error";

export type GeolocationState = {
  status: GeolocationStatus;
  position: GeoPosition | null;
  error: string | null;
};

/**
 * Precise (high-accuracy) browser geolocation. Starts watching only after
 * `start()` is called, so no permission prompt is triggered before the user
 * opts in via the location modal.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    status: "idle",
    position: null,
    error: null,
  });
  const watchIdRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({
        status: "unavailable",
        position: null,
        error: "Geolocation is not supported by this browser.",
      });
      return;
    }

    setState((previous) => ({ ...previous, status: "pending", error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          status: "granted",
          position: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          error: null,
        });
      },
      (error) => {
        setState({
          status: error.code === error.PERMISSION_DENIED ? "denied" : "error",
          position: null,
          error: error.message,
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { ...state, start, stop };
}
