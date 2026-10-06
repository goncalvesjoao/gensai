import polygons from '../data/japan-boundary.json';

export const TOKYO = { lng: 139.6917, lat: 35.6895 };
export const JAPAN_BOUNDS = [
  [122.5, 20],
  [154.5, 46],
];
const indexed = polygons.map((rings) => ({
  rings,
  bounds: rings[0].reduce(
    (b, [x, y]) => [
      Math.min(b[0], x),
      Math.min(b[1], y),
      Math.max(b[2], x),
      Math.max(b[3], y),
    ],
    [Infinity, Infinity, -Infinity, -Infinity],
  ),
}));

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

export function isJapanLocation(location) {
  const { lng, lat } = location ?? {};
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  // GSI's southernmost rock is absent from MLIT's generalized polygons.
  // Its published coordinate has about one arcsecond uncertainty (40m here).
  if (
    Math.hypot(
      (lng - 136.069722) * Math.cos((lat * Math.PI) / 180),
      lat - 20.425278,
    ) <
    40 / 111320
  )
    return true;
  return indexed.some(
    ({ rings, bounds: [west, south, east, north] }) =>
      lng >= west &&
      lng <= east &&
      lat >= south &&
      lat <= north &&
      inRing(lng, lat, rings[0]) &&
      !rings.slice(1).some((ring) => inRing(lng, lat, ring)),
  );
}
