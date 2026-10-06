# Official hazard sources and drawing order

Accepted on 2026-10-06 for [spec #11](https://github.com/goncalvesjoao/gensai/issues/11) and [ticket #20](https://github.com/goncalvesjoao/gensai/issues/20). The Gensai map uses official raster tiles with their original colours and legends, on GSI's pale basemap. The drawing order is a display decision, not a ranking of danger or a combined hazard assessment.

## Sources and supported scales

The [Hazard Map Portal open-data catalogue](https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html) supplies these 256-pixel XYZ PNG tiles at zoom levels 2 through 17. Prefix every hazard path below with `https://disaportaldata.gsi.go.jp/raster/`.

| Dataset                                            | Tile path                                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Tsunami inundation depth                           | `04_tsunami_newlegend_data/{z}/{x}/{y}.png`                                                                                         |
| Maximum-scale river inundation, national rivers    | `01_flood_l2_shinsuishin_kuni_data/{z}/{x}/{y}.png`                                                                                 |
| Maximum-scale river inundation, prefectural rivers | `01_flood_l2_shinsuishin_pref_data/{prefecture}/{z}/{x}/{y}.png`, with the catalogue's two-digit prefecture codes `01` through `47` |
| Debris-flow warning zones                          | `05_dosekiryukeikaikuiki/{z}/{x}/{y}.png`                                                                                           |
| Steep-slope-collapse warning zones                 | `05_kyukeishakeikaikuiki/{z}/{x}/{y}.png`                                                                                           |
| Landslide warning zones                            | `05_jisuberikeikaikuiki/{z}/{x}/{y}.png`                                                                                            |

For display, use the official integrated river raster `01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png`, which the catalogue explicitly identifies as combining national and prefectural river data. Draw the national-only raster above it. Name the lower source as combined data, not prefectural-only data. This avoids requesting 47 prefectural sources per viewport while preserving national precedence. The unprefixed `01_flood_l2_shinsuishin_pref_data/{z}/{x}/{y}.png` is not a documented nationwide endpoint and returned 404 in the check below.

Use GSI pale tiles at `https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png`, tile size 256, source zoom levels 2 through 18. The [GSI tile catalogue](https://maps.gsi.go.jp/development/ichiran.html) records the scales and geographical scope. At map zoom 18, overzoom the hazard source's zoom-17 tile instead of requesting nonexistent zoom-18 hazard tiles. Enlargement does not increase accuracy.

## Rendering and interpretation

Draw from bottom to top:

1. Pale basemap.
2. Combined maximum-scale river inundation depth.
3. National maximum-scale river inundation depth.
4. Tsunami inundation depth.
5. Landslide warning zones.
6. Debris-flow warning zones.
7. Steep-slope-collapse warning zones.
8. The selected-location marker.

National river mapping wins an overlap because it provides an explicit, reproducible river composition rule. It does not establish that national data is more severe or more accurate. The integrated raster already contains national mapping, so its duplication is harmless for fully opaque interior pixels. Provider antialiasing can remain at edges.

Place water-depth categories below the smaller landslide polygons to keep those polygons visible. Place the default tsunami category above river flooding. Within landslide, draw the broader landslide polygons first, then debris flow, then steep slopes so small slope areas remain visible. These are application choices. The official sources do not prescribe a cross-category danger priority.

Set raster opacity to 1 and fade duration to 0; preserve the source pixels, including provider alpha at boundaries. Do not recolour, apply multiply blending, calculate combined depths, or interpret the top colour as the only hazard present. Show every enabled category's legend and explain that layers above can obscure layers below. Independent switches let the resident inspect each category alone. Preserve the pale basemap across both application themes.

A live composite of pale, combined river, tsunami, debris and steep-slope tiles at `12/3635/1617`, near Kamakura, was visually inspected. Depth colours and the small yellow, orange and red warning-zone shapes remain legible over the subdued grey labels and roads. This is a representative source check; phone/computer and theme acceptance belongs to the integrated visible-map checks.

## Official legends

The shared official [depth legend](https://disaportal.gsi.go.jp/hazardmap/copyright/img/shinsui_legend3.png) applies to tsunami and these river datasets. The following colours were read directly from its PNG swatches. Preserve the optional depth subdivisions shown by the source; do not force every dataset into six bands.

| Depth                                       | RGB hex   |
| ------------------------------------------- | --------- |
| Less than 0.5 m                             | `#f7f5a9` |
| Optional less than 0.3 m subdivision        | `#ffffb3` |
| 0.5 m to less than 3 m                      | `#ffd8c0` |
| Optional 0.5 m to less than 1 m subdivision | `#f8e1a6` |
| 3 m to less than 5 m                        | `#ffb7b7` |
| 5 m to less than 10 m                       | `#ff9191` |
| 10 m to less than 20 m                      | `#f285c9` |
| 20 m or more                                | `#dc7adc` |

The three official landslide legends have distinct palettes. Read rows as warning zone and special warning zone, and columns as designated and planned designation. Blue dashed boundaries identify planned designation, not missing-data coverage.

| Type and official legend                                                                          | Designated warning / special warning | Planned warning / special warning |
| ------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------- |
| [Debris flow](https://disaportal.gsi.go.jp/hazardmap/copyright/img/keikai_dosekiryu.png)          | `#e6c832` / `#a50021`                | `#ebd35b` / `#b7334d`             |
| [Steep-slope collapse](https://disaportal.gsi.go.jp/hazardmap/copyright/img/keikai_kyukeisya.png) | `#fae600` / `#fa2800`                | `#fbeb33` / `#fb5333`             |
| [Landslide](https://disaportal.gsi.go.jp/hazardmap/copyright/img/keikai_jisuberi.png)             | `#ff9900` / `#b40028`                | `#ffad33` / `#c33353`             |

The catalogue reports the three current landslide rasters as GSI processing of MLIT's 2025 warning-zone dataset, supplied from 2026-08-06. Legends need separate bilingual type labels and a translated explanation of designated, special warning and planned boundaries. A generic yellow/red landslide legend would lose the source distinctions.

## Attribution and reuse

Keep linked source attribution readable outside the hazard menu. Use these source credits for the relevant datasets:

| Source                              | Credit text and link                                                                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pale basemap                        | `国土地理院 / GSI`, linked to the [GSI tile catalogue](https://maps.gsi.go.jp/development/ichiran.html)                                                                                                                                                                  |
| All hazard rasters                  | `出典：ハザードマップポータルサイト`, linked to the [Hazard Map Portal catalogue](https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html)                                                                                                                        |
| National river data                 | `国土交通省各地方整備局等 / MLIT regional development bureaus`                                                                                                                                                                                                           |
| Prefectural and combined river data | `都道府県・市町村等 / Prefectures and municipalities`, plus the national credit for combined data                                                                                                                                                                        |
| Tsunami data                        | `都道府県 / Prefectures`                                                                                                                                                                                                                                                 |
| Each landslide type                 | `国土交通省国土数値情報「令和7年度土砂災害警戒区域」をもとに国土地理院が加工 / GSI processing of MLIT National Land Numerical Information, 2025 landslide warning zones`, linked to the [2025 dataset](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A33-2025.html) |

For the pale basemap at zoom levels 5 through 8, retain the additional shoreline credit required by its catalogue entry: `Shoreline data is derived from: United States. National Imagery and Mapping Agency. "Vector Map Level 0 (VMAP0)." Bethesda, MD: Denver, CO: The Agency; USGS Information Services, 1997.` It can remain visible at other zoom levels.

[Portal reuse terms](https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/copyright/copyright.html) apply Public Data License 1.0 unless a separate source condition applies. They require source credit and a processing notice when editing. Label this application's composition as `ハザードマップポータルサイトをもとにGensaiが重ね合わせ表示 / Gensai displays layers from the Hazard Map Portal`. Do not imply that GSI authored Gensai's interface or drawing order. The catalogue expressly permits real-time commercial and noncommercial access, subject to source conditions.

For the basemap, [GSI terms](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html) and the tile catalogue govern reuse. The catalogue permits real-time display in websites/apps with linked attribution and no survey-use application. This decision covers live tile display, not redistribution of a generated map product.

Landslide reuse additionally follows the [MLIT terms](https://nlftp.mlit.go.jp/ksj/other/agreement.html), the dataset's CC BY 4.0 with restrictions, and the official [2025 prefectural conditions workbook](https://nlftp.mlit.go.jp/ksj/gml/codelist/A33_permision_R7.xlsx), which was downloaded and read during research. Do not describe the national landslide raster as unrestricted commercial open data:

- Kyoto prohibits commercial secondary use. This decision supports the current noncommercial map; a commercial launch must obtain permission or omit Kyoto via verified geographic/source boundaries.
- Kanagawa prohibits using this data as the basis of statutory landslide-law applications. Wakayama prohibits using it as application or other evidentiary material and identifies processing of Wakayama's original data.
- Tottori and Hiroshima require readers to understand that shapes show approximate reference positions, not authoritative legal boundaries. Hiroshima directs exact enquiries to its construction offices.
- Nagasaki requires attribution of the original source.
- Every prefecture's data is a reference dataset at approximately 1:25,000 to 1:50,000 accuracy, may omit designated areas and may lag additions or removals. Do not use it as legal boundary evidence, real-estate statutory disclosures or application evidence.

The workbook also supplies prefectural derivative-source credits. Include these in accessible source details for nationwide landslide display, with the license links supplied by that workbook:

| Prefecture | Original source credit                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Miyagi     | 宮城県砂防総合情報システム MIDSKI                                                                                                                         |
| Yamagata   | 山形県土砂災害警戒システム                                                                                                                                |
| Fukushima  | 土砂アラート・福島県土砂災害情報システム                                                                                                                  |
| Chiba      | ちば情報マップ・千葉県・国土数値情報, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja)                                                    |
| Niigata    | 土砂災害（特別）警戒区域・新潟県・国土数値情報, CC BY 4.0                                                                                                 |
| Ishikawa   | 石川県土木部砂防課・土砂災害（特別）警戒区域図オープンデータ                                                                                              |
| Fukui      | 福井県オープンデータライブラリ・土砂災害警戒区域指定地位置情報・国土数値情報, CC BY 4.0                                                                   |
| Nagano     | 信州砂防情報マップ・長野県・国土数値情報, CC BY 4.0                                                                                                       |
| Shizuoka   | 静岡県地理情報システム・静岡県GIS                                                                                                                         |
| Aichi      | 愛知県オープンデータカタログ（マップあいち公開データ）・土砂災害情報マップ・国土数値情報, [CC BY 2.1 JP](https://creativecommons.org/licenses/by/2.1/jp/) |
| Shiga      | 滋賀県防災情報マップ                                                                                                                                      |
| Tottori    | 鳥取県オープンデータポータルサイト・土砂災害警戒区域等データ・国土数値情報, CC BY 2.1 JP                                                                  |
| Hiroshima  | 土砂災害ポータルひろしま・広島県Dobox, CC BY as stated in workbook                                                                                        |
| Kochi      | 高知県の土砂災害危険度情報                                                                                                                                |
| Fukuoka    | 福岡県オープンデータカタログサイト・土砂災害警戒区域等のShapeデータ・国土数値情報, CC BY 2.1 JP                                                           |
| Nagasaki   | 長崎県オープンデータカタログサイト・土砂災害警戒区域等・国土数値情報, CC BY 4.0                                                                           |
| Kagoshima  | 鹿児島県オープンデータカタログサイト・鹿児島県土砂災害警戒区域データ等・国土数値情報, CC BY 4.0                                                           |

The above source credits refer to GSI/MLIT's processing of originals. Keep that derivative relationship explicit in source details. Link the workbook for the complete original-source statements and data dates, which differ by prefecture.

## Coverage and failed requests

[GSI FAQ 23 and 24](https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/faq/faq.html) explain that an uncoloured place can mean no mapped hazard or data not yet prepared. Checking new source publications delays portal updates. Zooming further does not establish greater accuracy; source geometries, mesh, rendering and basemap positions can differ from municipal originals.

Keep `No colour does not mean safe. Data may be missing` and its Japanese translation beside the enabled legends. Link the official catalogue and municipal maps for publication information. Coverage remains unknown unless an authoritative boundary dataset establishes it. The catalogue's prefecture lists describe publication, not complete surveyed coverage within each prefecture. Transparent pixels, a missing tile and an empty tile do not provide unavailable-coverage boundaries. Do not derive hatching from them.

A 404 means that this endpoint supplied no tile for that coordinate. Explain unavailable tile/unknown coverage separately from a network failure or server error. Never turn either into a safety conclusion. Keep map readiness and each hazard category's loading/failure explanation independent; one successful source cannot clear another source's failure.

## Verification evidence

Live HTTP checks on 2026-10-06 returned 200 with PNG signatures and decoded 256 × 256 images for each six-dataset source at `5/28/12`, using prefectural flood code `13`. The combined flood and pale endpoints also returned valid PNGs. This verifies access methods, not national completeness.

At `12/3635/1617`, tsunami, combined flood, debris flow, steep-slope collapse and pale tiles returned 200. National-only river and landslide returned 404. Those results demonstrate why absent display must remain distinct from a safety verdict. The official legend PNGs were visually inspected and their fill RGB values sampled directly. Integrated feature acceptance must still check visible category/legend matching, independent switches, partial failures, both languages and phone/computer layouts.
