# fishingmap

A full-window Leaflet map for saving fishing spots, built with Next.js 15 (App Router), React 19 and TypeScript.

## Features

- Full-viewport OpenStreetMap base layer with an optional OpenSeaMap seamark overlay and a layer switcher (top-right).
- Initial map center from IP geolocation; falls back to a worldwide view (zoom 2) when it is unavailable.
- Click the map to save a marker with a name, description and one of four pin icons (fish, anchor, warning, pin).
- Markers are stored in `localStorage` under `fishingmap.markers`.
- Marker names appear as permanent labels once the map zoom reaches 13.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm start       # serve the production build
```

## IP geolocation

`app/api/location/route.ts` reads the `x-vercel-ip-latitude`, `x-vercel-ip-longitude`, `x-vercel-ip-city` and `x-vercel-ip-country` headers that Vercel injects, and returns `{ lat, lng, label }`.

- **On Vercel:** the headers are present, so the map opens centered on the visitor's approximate city (zoom 10).
- **Locally:** `next dev` sends none of these headers, so the route returns `null` coordinates and the map opens at `[20, 0]` with zoom 2.
