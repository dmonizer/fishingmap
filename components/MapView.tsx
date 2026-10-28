"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import type { LatLng, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";
import MarkerForm, { type MarkerDraft } from "./MarkerForm";
import LocationPermissionModal from "./LocationPermissionModal";
import { OrthoPhotoLayer } from "./OrthoPhotoLayer";
import UserLocationLayer from "./UserLocationLayer";
import WeatherStationsLayer from "./WeatherStationsLayer";
import { getMarkerIcon } from "@/lib/icons";
import { loadMarkers, saveMarkers } from "@/lib/storage";
import { useGeolocation } from "@/lib/useGeolocation";
import { isAndroid, wazeNavigateUrl } from "@/lib/waze";
import {
  LABEL_ZOOM_THRESHOLD,
  type FishingMarker,
  type IconType,
  type UserLocation,
} from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const LOCATED_ZOOM = 10;
const GPS_LOCATED_ZOOM = 12;

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SEAMARK_URL = "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png";
const SEAMARK_ATTRIBUTION =
  '&copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors';
const RADAR_WMS_URL = "https://ilmgs.envir.ee/geoserver/ilm/wms";
const RADAR_ATTRIBUTION =
  '&copy; <a href="https://www.ilmateenistus.ee">Estonian Environment Agency</a>';

const ORTHO_ATTRIBUTION =
  '&copy; <a href="https://maaruum.ee">Maa- ja Ruumiamet</a>';
const ENC_WMS_URL = "https://gis.transpordiamet.ee/primar/wms_ip/TranspordiametNutimeri";
const ENC_ATTRIBUTION =
  '&copy; <a href="https://transpordiamet.ee">Estonian Transport Administration</a> / <a href="https://services.ecc.no">PRIMAR</a>';

type View = { lat: number; lng: number; zoom: number };

function MapBehavior({
  onZoom,
  onClick,
}: {
  onZoom: (zoom: number) => void;
  onClick: (latlng: LatLng, point: { x: number; y: number }) => void;
}) {
  const map = useMap();
  useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
    click: (event) => onClick(event.latlng, event.containerPoint),
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
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [following, setFollowing] = useState(false);
  const [showMarkerList, setShowMarkerList] = useState(false);
  const markerRefs = useRef<Record<string, LeafletMarker>>({});
  const geo = useGeolocation();
  const locatedByGps = useRef(false);

  useEffect(() => {
    setMarkers(loadMarkers());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveMarkers(markers);
  }, [markers, hydrated]);

  // IP-based fallback so the map is still centered even if GPS is denied.
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

  // First precise GPS fix wins over the IP fallback and flies the map there.
  useEffect(() => {
    if (geo.status === "granted" && geo.position && !locatedByGps.current) {
      locatedByGps.current = true;
      setView({ lat: geo.position.lat, lng: geo.position.lng, zoom: GPS_LOCATED_ZOOM });
    }
  }, [geo.status, geo.position]);

  const handleAllowLocation = useCallback(() => {
    setShowLocationModal(false);
    geo.start();
  }, [geo]);

  const handleDenyLocation = useCallback(() => {
    setShowLocationModal(false);
  }, []);

  const handleMapClick = useCallback((latlng: LatLng, point: { x: number; y: number }) => {
    setDraft({ lat: latlng.lat, lng: latlng.lng, x: point.x, y: point.y });
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

  const handleFocusMarker = useCallback(
    (id: string) => {
      const marker = markers.find((item) => item.id === id);
      if (!marker) return;
      setFollowing(false);
      setShowMarkerList(false);
      setView({
        lat: marker.lat,
        lng: marker.lng,
        zoom: Math.max(zoom, LABEL_ZOOM_THRESHOLD),
      });
      window.setTimeout(() => {
        markerRefs.current[id]?.openPopup();
      }, 600);
    },
    [markers, zoom],
  );

  const hasLocation = geo.status === "granted" && geo.position !== null;

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
          <LayersControl.BaseLayer name="Orthophoto (Maa-amet)">
            <OrthoPhotoLayer attribution={ORTHO_ATTRIBUTION} />
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
          <LayersControl.Overlay checked name="Weather stations (coast)">
            <WeatherStationsLayer />
          </LayersControl.Overlay>
        </LayersControl>

        <MapBehavior onZoom={setZoom} onClick={handleMapClick} />
        <FlyTo view={view} />
        <UserLocationLayer position={geo.position} following={following} />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={getMarkerIcon(marker.icon)}
            ref={(instance) => {
              if (instance) markerRefs.current[marker.id] = instance;
              else delete markerRefs.current[marker.id];
            }}
          >
            {zoom >= LABEL_ZOOM_THRESHOLD && (
              <Tooltip permanent direction="top" offset={[0, -30]} className="marker-label">
                {marker.name}
              </Tooltip>
            )}
            <Popup>
              <div className="marker-popup">
                <strong>{marker.name}</strong>
                {marker.description && <p>{marker.description}</p>}
                {isAndroid() && (
                  <a
                    className="button waze-link"
                    href={wazeNavigateUrl(marker.lat, marker.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Waze here
                  </a>
                )}
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

      {(hasLocation || markers.length > 0) && (
        <div className="map-actions">
          {hasLocation && (
            <button
              type="button"
              className={`follow-button${following ? " follow-button--active" : ""}`}
              aria-pressed={following}
              onClick={() => setFollowing((value) => !value)}
            >
              {following ? "Following" : "Follow my location"}
            </button>
          )}
          {markers.length > 0 && (
            <button
              type="button"
              className="list-button"
              onClick={() => setShowMarkerList((value) => !value)}
            >
              My points ({markers.length})
            </button>
          )}
        </div>
      )}

      {showMarkerList && markers.length > 0 && (
        <div className="marker-list">
          <div className="marker-list__header">
            <span className="marker-list__title">My points</span>
            <button
              type="button"
              className="marker-list__close"
              aria-label="Close"
              onClick={() => setShowMarkerList(false)}
            >
              ✕
            </button>
          </div>
          <ul className="marker-list__items">
            {[...markers]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((marker) => (
                <li key={marker.id}>
                  <button
                    type="button"
                    className="marker-list__item"
                    onClick={() => handleFocusMarker(marker.id)}
                  >
                    <span className="marker-list__name">
                      {marker.name.trim() ? marker.name : "(unnamed)"}
                    </span>
                    <span className="marker-list__coords">
                      {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      {draft && (
        <MarkerForm
          draft={draft}
          onSave={handleSave}
          onCancel={() => setDraft(null)}
        />
      )}

      {showLocationModal && (
        <LocationPermissionModal
          onAllow={handleAllowLocation}
          onDeny={handleDenyLocation}
        />
      )}
    </div>
  );
}
