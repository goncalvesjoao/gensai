import assert from 'node:assert/strict';
import { test } from 'vitest';
import { isJapanLocation } from '../src/lib/selected-location.mjs';

test('Japan boundary accepts mainland and islands, including Okinotorishima', async () => {
  for (const [lat, lng] of [
    [35.6895, 139.6917],
    [26.2124, 127.6809],
    [24.467, 122.998],
    [27.094, 142.191],
    [24.288, 153.979],
    [20.425278, 136.069722],
  ])
    assert.equal(await isJapanLocation({ lat, lng }), true, `${lat}, ${lng}`);
});

test('Japan boundary rejects overseas, ocean, polygon holes and invalid coordinates', async () => {
  for (const location of [
    { lat: 37.5665, lng: 126.978 },
    { lat: 30, lng: 140 },
    // Interior of the retained source polygon's triangular hole.
    { lat: 24.40085, lng: 123.8096 },
    // Outside the documented 40m Okinotorishima allowance.
    { lat: 20.426278, lng: 136.069722 },
    { lat: NaN, lng: 139.6917 },
    { lat: 35.6895, lng: Infinity },
    { lat: '35.6895', lng: 139.6917 },
    null,
    {},
  ])
    assert.equal(
      await isJapanLocation(location),
      false,
      JSON.stringify(location),
    );
});
