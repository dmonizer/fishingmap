import proj4 from "proj4";

export type Point = readonly [number, number];

// L-EST97 (EPSG:3301) — the Estonian national coordinate system used by the
// Estonian Land Board (Maa- ja Ruumiamet) WMS services.
const EST97_PROJ4 =
  "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 " +
  "+lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +units=m +no_defs";

const toEst97 = proj4("EPSG:4326", EST97_PROJ4);

/** Projects WGS84 longitude/latitude into L-EST97 easting/northing metres. */
export function projectEst97(lng: number, lat: number): Point {
  const [x, y] = toEst97.forward([lng, lat]);
  return [x, y];
}

/**
 * Least-squares affine fit mapping each `src` point onto the matching `dst`
 * point. Returns `[a, b, c, d, e, f]` such that:
 *
 *   dstX = a * srcX + b * srcY + e
 *   dstY = c * srcX + d * srcY + f
 */
export function fitAffine(
  src: Point[],
  dst: Point[],
): [number, number, number, number, number, number] {
  let sxx = 0;
  let sxy = 0;
  let sx = 0;
  let syy = 0;
  let sy = 0;
  const bx = [0, 0, 0];
  const by = [0, 0, 0];

  for (let i = 0; i < src.length; i += 1) {
    const [x, y] = src[i];
    const [dx, dy] = dst[i];
    sxx += x * x;
    sxy += x * y;
    sx += x;
    syy += y * y;
    sy += y;
    bx[0] += x * dx;
    bx[1] += y * dx;
    bx[2] += dx;
    by[0] += x * dy;
    by[1] += y * dy;
    by[2] += dy;
  }

  const normal = [
    [sxx, sxy, sx],
    [sxy, syy, sy],
    [sx, sy, src.length],
  ];

  const [a, b, e] = solve3(normal, bx);
  const [c, d, f] = solve3(normal, by);
  return [a, b, c, d, e, f];
}

function solve3(matrix: number[][], rhs: number[]): [number, number, number] {
  const m = matrix.map((row, i) => [...row, rhs[i]]);
  for (let col = 0; col < 3; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < 3; row += 1) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (pivot !== col) [m[col], m[pivot]] = [m[pivot], m[col]];

    const divisor = m[col][col];
    if (divisor === 0) continue;
    for (let row = 0; row < 3; row += 1) {
      if (row === col) continue;
      const factor = m[row][col] / divisor;
      for (let c = col; c < 4; c += 1) m[row][c] -= factor * m[col][c];
    }
  }
  return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]];
}
