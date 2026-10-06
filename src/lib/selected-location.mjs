export const TOKYO = { lng: 139.6917, lat: 35.6895 };
export const JAPAN_BOUNDS = [
  [122.5, 20],
  [154.5, 46],
];

export async function isJapanLocation(location) {
  const boundary = await import('./japan-boundary.mjs');
  return boundary.isJapanLocation(location);
}
