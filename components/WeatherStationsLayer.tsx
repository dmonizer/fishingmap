"use client";

import { useEffect, useState } from "react";
import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { PathOptions } from "leaflet";
import type { WeatherReading } from "@/lib/weather";

const STATION_STYLE: PathOptions = {
  color: "#1565c0",
  fillColor: "#1e88e5",
  fillOpacity: 0.9,
  weight: 2,
};

const SOURCE_NOTE = "Keskkonnaagentuur · ilmateenistus.ee";

function format(value: number | null, unit = ""): string {
  return value === null ? "–" : `${value}${unit}`;
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

  return (
    <>
      {stations.map((station) => (
        <CircleMarker
          key={station.name}
          center={[station.lat, station.lng]}
          radius={6}
          pathOptions={STATION_STYLE}
        >
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
                    value={`${format(station.airTemp)} °C`}
                  />
                  <ReadingRow
                    label="Veetemperatuur"
                    value={`${format(station.waterTemp)} °C`}
                  />
                  <ReadingRow
                    label="Tuul (suund)"
                    value={`${format(station.windDir)} °`}
                  />
                  <ReadingRow
                    label="Tuul (keskmine)"
                    value={`${format(station.windSpeed)} m/s`}
                  />
                  <ReadingRow
                    label="Tuul (max)"
                    value={`${format(station.maxWind)} m/s`}
                  />
                  <ReadingRow
                    label="Veetase EH2000"
                    value={`${format(station.waterLevelEh2000)} cm`}
                  />
                  <ReadingRow
                    label="Veetase BK77"
                    value={`${format(station.waterLevelBk77)} cm`}
                  />
                  <ReadingRow
                    label="Muutus 24 h"
                    value={`${format(station.waterLevelChange24h)} cm`}
                  />
                </tbody>
              </table>
              <div className="weather-popup__source">
                {observedAt ? `${observedAt} · ` : ""}
                {SOURCE_NOTE}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
