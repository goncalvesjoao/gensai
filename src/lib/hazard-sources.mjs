// Source order is bottom to top; see docs/adr/0001-official-hazard-sources.md.
export const HAZARD_SOURCES = [
  {
    id: 'flood-combined',
    category: 'flooding',
    path: '01_flood_l2_shinsuishin_data',
    name: [
      'Maximum-scale river flooding: national and prefectural data',
      '想定最大規模の河川洪水：国・都道府県データ',
    ],
  },
  {
    id: 'flood-national',
    category: 'flooding',
    path: '01_flood_l2_shinsuishin_kuni_data',
    name: [
      'Maximum-scale river flooding: national data',
      '想定最大規模の河川洪水：国管理河川データ',
    ],
  },
  {
    id: 'tsunami',
    category: 'tsunami',
    path: '04_tsunami_newlegend_data',
    name: ['Tsunami inundation depth', '津波浸水深'],
  },
  {
    id: 'landslide',
    category: 'landslide',
    path: '05_jisuberikeikaikuiki',
    name: ['Landslide warning zones', '地すべり警戒区域'],
    colours: ['#ff9900', '#b40028', '#ffad33', '#c33353'],
  },
  {
    id: 'debris',
    category: 'landslide',
    path: '05_dosekiryukeikaikuiki',
    name: ['Debris flow', '土石流'],
    colours: ['#e6c832', '#a50021', '#ebd35b', '#b7334d'],
  },
  {
    id: 'steep-slope',
    category: 'landslide',
    path: '05_kyukeishakeikaikuiki',
    name: ['Steep-slope collapse', '急傾斜地の崩壊'],
    colours: ['#fae600', '#fa2800', '#fbeb33', '#fb5333'],
  },
];
export const DEPTH_LEGEND = [
  ['#ffffb3', 'Below 0.3 m (where provided)', '0.3m未満（データがある場合）'],
  ['#f7f5a9', 'Below 0.5 m', '0.5m未満'],
  ['#f8e1a6', '0.5–1 m (where provided)', '0.5〜1m（データがある場合）'],
  ['#ffd8c0', '0.5–3 m', '0.5〜3m'],
  ['#ffb7b7', '3–5 m', '3〜5m'],
  ['#ff9191', '5–10 m', '5〜10m'],
  ['#f285c9', '10–20 m', '10〜20m'],
  ['#dc7adc', '20 m or more', '20m以上'],
];

export const LANDSLIDE_CREDITS = [
  '宮城県砂防総合情報システム MIDSKI',
  '山形県土砂災害警戒システム',
  '土砂アラート・福島県土砂災害情報システム',
  'ちば情報マップ・千葉県・国土数値情報, CC BY 4.0',
  '土砂災害（特別）警戒区域・新潟県・国土数値情報, CC BY 4.0',
  '石川県土木部砂防課・土砂災害（特別）警戒区域図オープンデータ',
  '福井県オープンデータライブラリ・土砂災害警戒区域指定地位置情報・国土数値情報, CC BY 4.0',
  '信州砂防情報マップ・長野県・国土数値情報, CC BY 4.0',
  '静岡県地理情報システム・静岡県GIS',
  '愛知県オープンデータカタログ（マップあいち公開データ）・土砂災害情報マップ・国土数値情報, CC BY 2.1 JP',
  '滋賀県防災情報マップ',
  '鳥取県オープンデータポータルサイト・土砂災害警戒区域等データ・国土数値情報, CC BY 2.1 JP',
  '土砂災害ポータルひろしま・広島県Dobox, CC BY (see source conditions)',
  '高知県の土砂災害危険度情報',
  '福岡県オープンデータカタログサイト・土砂災害警戒区域等のShapeデータ・国土数値情報, CC BY 2.1 JP',
  '長崎県オープンデータカタログサイト・土砂災害警戒区域等・国土数値情報, CC BY 4.0',
  '鹿児島県オープンデータカタログサイト・鹿児島県土砂災害警戒区域データ等・国土数値情報, CC BY 4.0',
];
