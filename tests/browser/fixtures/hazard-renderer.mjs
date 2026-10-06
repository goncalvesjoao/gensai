import { Map } from 'maplibre-gl';
import { createHazardRenderer } from '../../../src/lib/hazard-renderer.mjs';

const map = new Map({
  container: document.getElementById('map'),
  center: [0, 0],
  zoom: 2,
  canvasContextAttributes: { preserveDrawingBuffer: true },
  attributionControl: false,
  style: {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#ffffff' },
      },
    ],
  },
});
map.once('load', () => {
  const renderer = createHazardRenderer(map, (states) => {
    document.getElementById('status').textContent = JSON.stringify(states);
  });
  document.getElementById('enable').onclick = () =>
    renderer.setLayers([
      {
        id: 'upper',
        order: 20,
        tiles: ['https://fixture.test/upper/{z}/{x}/{y}.png'],
      },
      {
        id: 'lower',
        order: 10,
        tiles: ['https://fixture.test/lower/{z}/{x}/{y}.png'],
      },
    ]);
  document.getElementById('disable').onclick = () => renderer.setLayers([]);
});
