export type IconType = "fish" | "anchor" | "warning" | "pin";

export type FishingMarker = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  description: string;
  icon: IconType;
};

export type UserLocation = {
  lat: number | null;
  lng: number | null;
  label: string | null;
};

export const ICON_TYPES: { value: IconType; label: string }[] = [
  { value: "fish", label: "Fish" },
  { value: "anchor", label: "Anchor" },
  { value: "warning", label: "Warning" },
  { value: "pin", label: "Pin" },
];

export const LABEL_ZOOM_THRESHOLD = 13;
