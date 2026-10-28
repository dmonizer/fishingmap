"use client";

import {
  createElementObject,
  createTileLayerComponent,
  updateGridLayer,
  withPane,
  type LayerProps,
} from "@react-leaflet/core";
import L from "leaflet";
import { fitAffine, projectEst97, type Point } from "@/lib/est97";

const ORTHO_WMS_URL = "https://kaart.maaamet.ee/wms/fotokaart";
const ORTHO_LAYER = "EESTIFOTO";
const ORTHO_SRS = "EPSG:3301";

/**
 * Estonian Land Board orthophoto, rendered as an EPSG:3301 (L-EST97) WMS and
 * warped onto the map's EPSG:3857 tile grid. The WMS only serves L-EST97, so
 * each tile is requested in that CRS and then aligned to the Web-Mercator tile
 * with a least-squares affine transform (accurate to well under a pixel at the
 * zoom levels used for placing markers).
 */
class OrthoGridLayer extends L.GridLayer {
  override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    // Leaflet positions the returned element itself (via translate3d), so the
    // affine warp is applied to an inner <img> instead of clobbering Leaflet's
    // positioning transform on the tile element.
    const tile = document.createElement("div");
    const img = document.createElement("img");
    img.alt = "";
    img.draggable = false;

    const size = this.getTileSize();
    const width = size.x;
    const height = size.y;

    img.style.position = "absolute";
    img.style.left = "0";
    img.style.top = "0";
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
    img.style.transformOrigin = "0 0";
    tile.appendChild(img);

    const map = this._map;
    const nw = map.unproject(coords.scaleBy(size), coords.z);
    const se = map.unproject(coords.scaleBy(size).add(size), coords.z);

    // Four corners (NW, NE, SE, SW) projected into L-EST97.
    const corners: Point[] = [
      projectEst97(nw.lng, nw.lat),
      projectEst97(se.lng, nw.lat),
      projectEst97(se.lng, se.lat),
      projectEst97(nw.lng, se.lat),
    ];

    const eastings = corners.map((p) => p[0]);
    const northings = corners.map((p) => p[1]);
    const minE = Math.min(...eastings);
    const maxE = Math.max(...eastings);
    const minN = Math.min(...northings);
    const maxN = Math.max(...northings);

    const bbox = `${minE},${minN},${maxE},${maxN}`;
    const url =
      `${ORTHO_WMS_URL}?service=WMS&version=1.1.1&request=GetMap` +
      `&layers=${ORTHO_LAYER}&srs=${ORTHO_SRS}&bbox=${bbox}` +
      `&width=${width}&height=${height}&format=image/jpeg`;

    img.onload = () => {
      const src: Point[] = corners.map(([easting, northing]) => [
        ((easting - minE) / (maxE - minE)) * width,
        ((maxN - northing) / (maxN - minN)) * height,
      ]);
      const dst: Point[] = [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
      ];
      const [a, b, c, d, e, f] = fitAffine(src, dst);
      // CSS matrix(m11, m12, m21, m22, tx, ty):
      //   x' = m11*x + m21*y + tx,  y' = m12*x + m22*y + ty
      img.style.transform = `matrix(${a},${c},${b},${d},${e},${f})`;
      done(undefined, tile);
    };
    img.onerror = () => done(new Error("Orthophoto tile failed to load"), tile);
    img.src = url;

    return tile;
  }
}

export interface OrthoPhotoLayerProps extends LayerProps, L.GridLayerOptions {}

export const OrthoPhotoLayer = createTileLayerComponent<
  L.GridLayer,
  OrthoPhotoLayerProps
>(
  function createOrthoPhotoLayer({ eventHandlers: _eh, ...options }, context) {
    const layer = new OrthoGridLayer(withPane(options, context));
    return createElementObject(layer, context);
  },
  function updateOrthoPhotoLayer(layer, props, prevProps) {
    updateGridLayer(layer, props, prevProps);
  },
);
