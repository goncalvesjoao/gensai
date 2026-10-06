import { hazardCategories } from './hazard-categories.mjs';
import { createHazardRenderer } from './hazard-renderer.mjs';

export const catalogue =
  'https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html';
export const depthLegend = [
  ['#FFFFB3', '< 0.3 m', '0.3m未満'],
  ['#F7F5A9', '0.3 ≤ depth < 0.5 m', '0.3m以上0.5m未満'],
  ['#F8E1A6', '0.5 ≤ depth < 1 m', '0.5m以上1m未満'],
  ['#FFD8C0', '1 ≤ depth < 3 m', '1m以上3m未満'],
  ['#FFB7B7', '3 ≤ depth < 5 m', '3m以上5m未満'],
  ['#FF9191', '5 ≤ depth < 10 m', '5m以上10m未満'],
  ['#F285C9', '10 ≤ depth < 20 m', '10m以上20m未満'],
  ['#DC7ADC', '≥ 20 m', '20m以上'],
];

// One registry drives rendering and interpretation. Order is ADR0001 bottom
// to top, never request-completion order. Only licensed, delivered sources
// belong here; switches for future categories do not trigger speculative URLs.
export const hazardLayers = [
  {
    id: 'tsunami',
    category: 'tsunami',
    order: 30,
    tiles: [
      'https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png',
    ],
    title: { en: 'Tsunami inundation depth', ja: '津波浸水想定' },
    legend: depthLegend,
    attribution:
      '出典：ハザードマップポータルサイト（津波浸水想定／都道府県データ）',
  },
];

export function attachHazardLayers(map, report) {
  const renderer = createHazardRenderer(map, report);
  function sync() {
    const enabled = hazardCategories.getSnapshot();
    renderer.setLayers(hazardLayers.filter((layer) => enabled[layer.category]));
  }
  const unsubscribe = hazardCategories.subscribe(sync);
  sync();
  return () => {
    unsubscribe();
    renderer.dispose();
  };
}
