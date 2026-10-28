"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map…</div>,
});

export default function Page() {
  return (
    <main className="map-shell">
      <MapView />
    </main>
  );
}
