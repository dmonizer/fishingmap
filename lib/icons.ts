import L from "leaflet";
import type { IconType } from "./types";

type IconDef = { color: string; glyph: string };

const ICONS: Record<IconType, IconDef> = {
  fish: { color: "#0b7fab", glyph: "&#128031;" },
  anchor: { color: "#1f8a4c", glyph: "&#9875;" },
  warning: { color: "#d93025", glyph: "&#9888;" },
  pin: { color: "#7b3fe4", glyph: "&#8226;" },
};

/** A teardrop map pin rendered as inline SVG plus its glyph, so no image assets are needed. */
function createMarkerIcon(type: IconType): L.DivIcon {
  const { color, glyph } = ICONS[type];
  return L.divIcon({
    className: "fishing-pin",
    html: `
      <svg class="fishing-pin__body" viewBox="0 0 24 36" width="24" height="36" aria-hidden="true">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${color}"/>
        <circle cx="12" cy="12" r="7" fill="#ffffff" fill-opacity="0.92"/>
      </svg>
      <span class="fishing-pin__glyph">${glyph}</span>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -32],
    tooltipAnchor: [12, -18],
  });
}

const cache = new Map<IconType, L.DivIcon>();

/** Icons are cached so marker re-renders keep a stable L.DivIcon instance. */
export function getMarkerIcon(type: IconType): L.DivIcon {
  let icon = cache.get(type);
  if (!icon) {
    icon = createMarkerIcon(type);
    cache.set(type, icon);
  }
  return icon;
}
