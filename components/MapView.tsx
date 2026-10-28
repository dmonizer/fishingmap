"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
  WMSTileLayer,
} from "react-leaflet";
import type { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";
import MarkerForm, { type MarkerDraft } from "./MarkerForm";
import { getMarkerIcon } from "@/lib/icons";
import { loadMarkers, saveMarkers } from "@/lib/storage";
import {
  LABEL_ZOOM_THRESHOLD,
  type FishingMarker,
  type IconType,
  type UserLocation,
} from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const LOCATED_ZOOM = 10;

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SEAMARK_URL = "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png";
const SEAMARK_ATTRIBUTION =
  '&copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors';
const RADAR_WMS_URL = "https://ilmgs.envir.ee/geoserver/ilm/wms";
const RADAR_ATTRIBUTION =
  '&copy; <a href="https://www.ilmateenistus.ee">Estonian Environment Agency</a>';
const ENC_WMS_URL = "https://gis.transpordiamet.ee/primar/wms_ip/TranspordiametNutimeri";
const ENC_ATTRIBUTION =
  '&copy; <a href="https://transpordiamet.ee">Estonian Transport Administration</a> / <a href="https://services.ecc.no">PRIMAR</a>';

type View = { lat: number; lng: number; zoom: number };

function MapBehavior({
  onZoom,
  onClick,
}: {
  onZoom: (zoom: number) => void;
  onClick: (latlng: LatLng) => void;
}) {
  const map = useMap();
  useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
    click: (event) => onClick(event.latlng),
  });
  return null;
}

function FlyTo({ view }: { view: View | null }) {
  const map = useMap();
  useEffect(() => {
    if (view) map.flyTo([view.lat, view.lng], view.zoom);
  }, [map, view]);
  return null;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `marker-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function MapView() {
  const [markers, setMarkers] = useState<FishingMarker[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<MarkerDraft | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    setMarkers(loadMarkers());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveMarkers(markers);
  }, [markers, hydrated]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/location")
      .then((response) => (response.ok ? response.json() : null))
      .then((location: UserLocation | null) => {
        if (cancelled || !location) return;
        if (typeof location.lat === "number" && typeof location.lng === "number") {
          setView({ lat: location.lat, lng: location.lng, zoom: LOCATED_ZOOM });
        }
      })
      .catch(() => {
        // Keep the default worldwide view when geolocation is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMapClick = useCallback((latlng: LatLng) => {
    setDraft({ lat: latlng.lat, lng: latlng.lng });
  }, []);

  const handleSave = useCallback(
    (values: { name: string; description: string; icon: IconType }) => {
      if (!draft) return;
      setMarkers((previous) => [
        ...previous,
        { id: newId(), lat: draft.lat, lng: draft.lng, ...values },
      ]);
      setDraft(null);
    },
    [draft],
  );

  const handleDelete = useCallback((id: string) => {
    setMarkers((previous) => previous.filter((marker) => marker.id !== id));
  }, []);

  return (
    <div className="map-view">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="map-canvas"
        zoomControl
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer url={OSM_URL} attribution={OSM_ATTRIBUTION} subdomains="abc" />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Seamarks (OpenSeaMap)">
            <TileLayer url={SEAMARK_URL} attribution={SEAMARK_ATTRIBUTION} />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Weather radar (Estonia)">
            <WMSTileLayer
              url={RADAR_WMS_URL}
              layers="ilm:cmp_cap"
              format="image/png"
              transparent
              version="1.1.0"
              opacity={0.65}
              attribution={RADAR_ATTRIBUTION}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Nautical charts (Transpordiamet)">
            <WMSTileLayer
              url={ENC_WMS_URL}
              layers="cells"
              styles="style-id-263"
              format="image/png"
              transparent
              version="1.1.1"
              attribution={ENC_ATTRIBUTION}
            />
          </LayersControl.Overlay>
        </LayersControl>

        <MapBehavior onZoom={setZoom} onClick={handleMapClick} />
        <FlyTo view={view} />

        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={getMarkerIcon(marker.icon)}>
            {zoom >= LABEL_ZOOM_THRESHOLD && (
              <Tooltip permanent direction="top" offset={[0, -30]} className="marker-label">
                {marker.name}
              </Tooltip>
            )}
            <Popup>
              <div className="marker-popup">
                <strong>{marker.name}</strong>
                {marker.description && <p>{marker.description}</p>}
                <button
                  type="button"
                  className="button button--danger"
                  onClick={() => handleDelete(marker.id)}
                >
                  Delete
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {draft && (
        <MarkerForm
          draft={draft}
          onSave={handleSave}
          onCancel={() => setDraft(null)}
        />
      )}
    </div>
  );
}
