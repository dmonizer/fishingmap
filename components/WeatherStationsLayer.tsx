"use client";

import { useEffect, useMemo, useState } from "react";
import { LayerGroup, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { WeatherReading } from "@/lib/weather";

const ARROW_COLOR = "#0b6ea8";

// Arrow points "up" (north) and is rotated clockwise by the meteorological
// wind direction (the direction the wind is blowing FROM).
const ARROW_SVG = `
<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <circle cx="12" cy="19" r="2.6" fill="${ARROW_COLOR}"/>
  <line x1="12" y1="17.2" x2="12" y2="7.5" stroke="${ARROW_COLOR}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M12 1.5 L5.5 9 L12 7.2 L18.5 9 Z" fill="${ARROW_COLOR}"/>
</svg>`;

const NO_WIND_SVG = `
<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
  <circle cx="12" cy="12" r="3.5" fill="none" stroke="#9aa7b1" stroke-width="2"/>
</svg>`;

const SOURCE_NOTE = "Keskkonnaagentuur · ilmateenistus.ee";

/** "9.6" -> "9.6", "14" -> "14"; null -> "–". */
function formatValue(value: number | null): string {
  if (value === null) return "–";
  return String(Number(value.toFixed(1)));
}

function createWindIcon(station: WeatherReading): L.DivIcon {
  const arrow =
    station.windDir === null
      ? `<div class="wind-station__arrow wind-station__arrow--na">${NO_WIND_SVG}</div>`
      : `<div class="wind-station__arrow" style="transform: rotate(${station.windDir}deg)">${ARROW_SVG}</div>`;

  const speed = formatValue(station.windSpeed);
  const temp = formatValue(station.waterTemp);

  return L.divIcon({
    className: "wind-station-marker",
    html:
      `<div class="wind-station">${arrow}` +
      `<span class="wind-station__speed">${speed} m/s</span>` +
      `<span class="wind-station__temp">${temp} °C</span></div>`,
    iconSize: [52, 54],
    iconAnchor: [26, 20],
    popupAnchor: [0, -8],
    tooltipAnchor: [26, -10],
  });
}

function ReadingRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="weather-popup__label">{label}</td>
      <td className="weather-popup__value">{value}</td>
    </tr>
  );
}

export default function WeatherStationsLayer() {
  const [stations, setStations] = useState<WeatherReading[]>([]);
  const [observedAt, setObservedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: { observedAt: string | null; stations: WeatherReading[] }) => {
        if (cancelled) return;
        setObservedAt(data.observedAt);
        setStations(data.stations);
      })
      .catch(() => {
        // Weather markers are optional; the map remains usable without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(
    () =>
      stations.map((station) => ({
        station,
        position: L.latLng(station.lat, station.lng),
        icon: createWindIcon(station),
      })),
    [stations],
  );

  return (
    <LayerGroup>
      {items.map(({ station, position, icon }) => (
        <Marker key={station.name} position={position} icon={icon}>
          <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
            {station.name}
          </Tooltip>
          <Popup>
            <div className="weather-popup">
              <strong>{station.name}</strong>
              <table>
                <tbody>
                  <ReadingRow
                    label="Õhutemperatuur"
                    value={`${formatValue(station.airTemp)} °C`}
                  />
                  <ReadingRow
                    label="Veetemperatuur"
                    value={`${formatValue(station.waterTemp)} °C`}
                  />
                  <ReadingRow
                    label="Tuule suund"
                    value={station.windDir === null ? "–" : `${station.windDir}°`}
                  />
                  <ReadingRow
                    label="Tuule kiirus"
                    value={`${formatValue(station.windSpeed)} m/s`}
                  />
                  <ReadingRow
                    label="Tuule puhangud"
                    value={`${formatValue(station.maxWind)} m/s`}
                  />
                  <ReadingRow
                    label="Veetase EH2000"
                    value={`${formatValue(station.waterLevelEh2000)} cm`}
                  />
                  <ReadingRow
                    label="Veetase BK77"
                    value={`${formatValue(station.waterLevelBk77)} cm`}
                  />
                  <ReadingRow
                    label="Muutus 24 h"
                    value={`${formatValue(station.waterLevelChange24h)} cm`}
                  />
                </tbody>
              </table>
              <div className="weather-popup__source">
                {observedAt ? `${observedAt} · ` : ""}
                {SOURCE_NOTE}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </LayerGroup>
  );
}
