import type { FishingMarker, IconType } from "./types";

export const STORAGE_KEY = "fishingmap.markers";

const VALID_ICONS: IconType[] = ["fish", "anchor", "warning", "pin"];

function isMarker(value: unknown): value is FishingMarker {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    typeof m.lat === "number" &&
    typeof m.lng === "number" &&
    typeof m.name === "string" &&
    typeof m.description === "string" &&
    VALID_ICONS.includes(m.icon as IconType)
  );
}

export function loadMarkers(): FishingMarker[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isMarker) : [];
  } catch {
    return [];
  }
}

export function saveMarkers(markers: FishingMarker[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch {
    // Storage may be unavailable (private mode, quota); markers stay in memory for this session.
  }
}
