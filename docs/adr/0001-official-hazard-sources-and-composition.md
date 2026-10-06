# Official hazard tiles, muted basemap and deterministic composition

Accepted for [ticket #20](https://github.com/goncalvesjoao/gensai/issues/20) under
[spec #11](https://github.com/goncalvesjoao/gensai/issues/11).
We use the GSI Hazard Map Portal's open raster data, GSI's pale basemap and
ordered, non-blending hazard composition. This preserves official classifications
without inventing a combined hazard score, while accepting that overlapping
hazards cannot all be read at the same pixel. Sources were retrieved on
**2026-10-06**; this records evidence at that time, not a promise of immutable
endpoints, licensing or coverage.

## Sources and access

The authoritative [open-data catalogue][catalogue] specifies all six hazard
datasets below at native zoom **2–17**. Use HTTPS XYZ PNG tiles following the
[GSI tile specification](https://maps.gsi.go.jp/development/siyou.html):
256 × 256 pixels, Web Mercator, northwest origin, x increasing east and y south.
Braces below are substitutions, not literal URL components. `{p}` is the
two-digit prefecture code (01–47), not the catalogue's CSV row number.

| Dataset / legend name                                                                      | Exact URL template                                                                              |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Tsunami inundation depth / 津波浸水想定                                                    | `https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png`             |
| Maximum-scale river depth, national / 洪水浸水想定区域（想定最大規模）_国管理河川          | `https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_kuni_data/{z}/{x}/{y}.png`     |
| Maximum-scale river depth, prefectural / 洪水浸水想定区域（想定最大規模）_都道府県管理河川 | `https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_pref_data/{p}/{z}/{x}/{y}.png` |
| Debris flow / 土砂災害警戒区域（土石流）                                                   | `https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki_data/{p}/{z}/{x}/{y}.png`      |
| Steep-slope collapse / 土砂災害警戒区域（急傾斜地の崩壊）                                  | `https://disaportaldata.gsi.go.jp/raster/05_kyukeishakeikaikuiki_data/{p}/{z}/{x}/{y}.png`      |
| Landslide / 土砂災害警戒区域（地すべり）                                                   | `https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki_data/{p}/{z}/{x}/{y}.png`       |

The catalogue lists all 47 prefecture paths for prefectural river depth and each
landslide type. **Do not remove the prefecture component**: no aggregate
landslide URL is listed there. Fetch the applicable prefectures for the viewport,
including neighboring prefectures; selected location alone must not restrict
the map. At prefecture seams use ascending code order (higher code above lower)
as a stable technical tie-break, not a judgment about accuracy.

The catalogue also offers combined river tiles at
`https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png`.
We do not use them: separate national/prefectural sources make partial failures
and our overlap rule explicit; the catalogue describes the combined product but
does not document its overlap precedence. Do not use design-scale (`l1`) data,
inland flooding, storm surge, flood duration or the old landslide-danger-location
dataset as substitutes.

### Basemap and scale

Choose GSI **淡色地図 (pale map)**:
`https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png`.
The [GSI tile list][tiles] describes native zoom **2–18**, worldwide at 2–8
(Japan and surroundings have their own source at 5–8), Japan and surroundings
at 9–11 and Japan at 12–18. It is not a worldwide street map at detailed zoom.
Keep the first-release map in **2–17**, the shared native hazard range, instead
of overzooming hazards or silently dropping them at 18. Zoom is a delivery limit,
not an accuracy scale. Do not present parcel-level certainty.

Pale map is preferred over standard map, aerial imagery or colored relief:
its light roads/labels provide orientation without another strong thematic
palette. Keep native basemap and hazard colors; no theme-dependent hazard
recoloring, extra global hazard opacity or multiplicative blending. Dark
application chrome does not require a dark basemap.

## Legends: classifications, not calculated depth

Both maximum-scale river sources and new-legend tsunami tiles link the same
[official depth legend][depthlegend]. Reproduce these eight entries in each
enabled category's own readable legend. Hex values below were sampled from
the interiors of that PNG, not inferred from color names. Boundary notation
uses the official Japanese lower-inclusive, upper-exclusive ranges.

| Depth               | Japanese label   | Official RGB hex |
| ------------------- | ---------------- | ---------------- |
| < 0.3 m             | 0.3m未満         | `#FFFFB3`        |
| 0.3 ≤ depth < 0.5 m | 0.3m以上0.5m未満 | `#F7F5A9`        |
| 0.5 ≤ depth < 1 m   | 0.5m以上1m未満   | `#F8E1A6`        |
| 1 ≤ depth < 3 m     | 1m以上3m未満     | `#FFD8C0`        |
| 3 ≤ depth < 5 m     | 3m以上5m未満     | `#FFB7B7`        |
| 5 ≤ depth < 10 m    | 5m以上10m未満    | `#FF9191`        |
| 10 ≤ depth < 20 m   | 10m以上20m未満   | `#F285C9`        |
| ≥ 20 m              | 20m以上          | `#DC7ADC`        |

The PNG's low-depth bands have stepped shapes: sample the **interior of each
swatch**, not the far-left strip (which includes neighboring bands). These
colors describe depth above ground, not elevation, probability or real-time
conditions. Flooding means maximum-scale **river** inundation, not all flooding.

Each landslide type needs its own section, with warning / 警戒区域 and special
warning / 特別警戒区域, plus designated / 指定済 and planned designation /
指定予定. The official legend images provide these colors:

| Type and official legend            | Warning, designated | Special warning, designated | Warning, planned | Special warning, planned |
| ----------------------------------- | ------------------- | --------------------------- | ---------------- | ------------------------ |
| [Debris flow][debrislegend]         | `#E6C832`           | `#A50021`                   | `#EBD35B`        | `#B7334D`                |
| [Steep-slope collapse][slopelegend] | `#FAE600`           | `#FA2800`                   | `#FBEB33`        | `#FB5333`                |
| [Landslide][slidelegend]            | `#FF9900`           | `#B40028`                   | `#FFAD33`        | `#C33353`                |

Planned areas have **dark-blue dashed borders** in the official legends; keep
the source borders and explain that they indicate planned designation, not
missing data. These are zone designations, not depth bands. Do not simplify
all three types into one yellow/red legend or substitute generic risk scores.
Use the linked official PNGs as the visual reference (including dashed
patterns); interior hex samples are not specifications for antialiased edges.

## Composition decision

Bottom to top, regardless of activation/request completion order:

1. Pale basemap.
2. Flooding: prefectural maximum-scale depth, then national maximum-scale depth.
3. Tsunami depth.
4. Landslide: landslide zones, debris-flow zones, steep-slope-collapse zones.
5. Selected-location marker and ordinary map UI.

National river data wins where national and prefectural nontransparent hazard
pixels overlap. This is a **Gensai display tie-break**, not GSI policy and not a
claim that the national depth is larger, newer or more accurate. Both use the
same depth legend, so blending would create meaningless intermediate colors.
Using national above prefectural gives a stable identifiable source; neither
the catalogue nor FAQ establishes a scientific priority. Do not compute maximum
depth from raster colors.

Tsunami sits above river depth because it is the initial category and both share
a depth palette that cannot identify their origin at an overlap. Landslide
zones sit above broad depth fills so small zones/borders are not hidden by
inundation fills. Within landslides, broad landslide zones are beneath debris
flow, then localized steep-slope zones. This order is a display choice, **not**
a ranking of danger or a claim that every slope zone is smaller. Keep the same
order on every request and layout.

At an overlapping pixel select the uppermost nontransparent hazard pixel;
preserve its source RGB/alpha and composite it against the basemap, **not**
against a lower hazard. Fully transparent pixels reveal the next hazard.
This avoids new hazard-to-hazard blended colors, including at source edges.
Do not assign extra layer opacity. If the renderer's default alpha stacking
cannot meet this rule, use a masking/composition mechanism that can; no library
or tile-request implementation is prescribed by this ADR.

Keep every enabled legend visible independently of the menu. State in both
languages that overlapping upper layers can conceal lower layers and that
switching categories off allows inspection of the others. The same depth
color cannot distinguish tsunami from river flooding at an overlap; labels and
individual switches are necessary. An opaque composition cannot show all
hazards simultaneously at one pixel. We reject blended overlays because their
colors no longer correspond to any official legend.

## Reuse and attribution

Use only the published open-data endpoints, not captured tiles from the portal's
non-open layers. The catalogue explicitly permits real-time commercial and
noncommercial website/application use. The [portal terms][portalterms] apply
**Public Data License 1.0 (PDL1.0)** unless otherwise stated, require attribution
and processing disclosure, and forbid presenting processed content as
government-authored. This is not blanket CC BY permission for all portal data.

The following are the exact **Gensai attribution strings chosen to satisfy**
the official examples and source-specific conditions; the official terms give
examples rather than prescribe one universal sentence. Display them readably
with the menu closed, linked to the cited source pages. Japanese provenance
names remain intact in either UI language.

| Source                    | Display attribution / additional disclosure                                                                                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tsunami                   | `出典：ハザードマップポータルサイト（津波浸水想定／都道府県データ）` linked to the catalogue                                                                                                                                                                           |
| National river            | `出典：ハザードマップポータルサイト（洪水浸水想定区域（想定最大規模）／国土交通省各地方整備局等）` linked to the catalogue                                                                                                                                             |
| Prefectural river         | `出典：ハザードマップポータルサイト（洪水浸水想定区域（想定最大規模）／都道府県・市町村等）` linked to the catalogue                                                                                                                                                   |
| All three landslide types | `出典：ハザードマップポータルサイト、国土交通省国土数値情報ダウンロードサイト（令和７年度土砂災害警戒区域）` linked to the catalogue and [A33-2025][a33]; `国土交通省政策統括官付地理空間情報課「国土数値情報（令和７年度土砂災害警戒区域）」をもとに国土地理院が加工` |
| Hazard composition        | `「ハザードマップポータルサイト」を加工してGensaiが作成（表示順序・重なりの処理）`                                                                                                                                                                                     |
| Pale basemap              | `地理院タイル（国土地理院）` linked to the [GSI tile list][tiles]                                                                                                                                                                                                      |

Real-time pale-map use is attribution-only, without a Survey Act application,
under the explicit tile-list guidance. Offline redistribution, exports and
modified basemaps would need their own terms/Survey Act assessment; they are
not approved by this decision.

### Landslide terms are conditional

All three landslide layers use **2025 (令和７年度) A33** data, introduced in
the catalogue on 2026-08-06. [A33-2025][a33] labels reuse
`オープンデータ（CC_BY_4.0（一部制限））` and requires both the
[MLIT site terms][mlitterms] (PDL1.0, effective 2026-03-23) and prefectural
conditions in the official [R7 conditions/data-date workbook][conditions].
It lists 41 prefectures as commercial-use/redistribution permitted and six as
conditional. The workbook was retrieved and its conditions checked:

| Prefecture     | Condition to preserve                                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kanagawa (14)  | Not evidence for applications under the landslide prevention law.                                                                                                                                    |
| Kyoto (26)     | **Commercial secondary use prohibited.**                                                                                                                                                             |
| Wakayama (30)  | Not for applications/other supporting documents; disclose processing of Wakayama's original data.                                                                                                    |
| Tottori (31)   | Approximate reference positions, not legal zone boundaries; consult the responsible authority for precise information.                                                                               |
| Hiroshima (34) | Approximate reference, not all statutory information; consult prefectural construction offices. Workbook also specifies CC BY and processing provenance from 土砂災害ポータルひろしま / 広島県Dobox. |
| Nagasaki (42)  | Credit original source. Workbook specifies CC BY 4.0 and attribution to 長崎県、国土数値情報、クリエイティブ・コモンズ・ライセンス 表示 4.0 国際.                                                    |

When applicable, additionally show:
`原典資料提供元の和歌山県が有しているデータを加工したものです。`;
`この国土数値情報（土砂災害警戒区域データ）は、土砂災害ポータルひろしまおよび広島県Doboxで公開されているデータを加工したものです（CC BY）。`;
`出典：長崎県、国土数値情報（CC BY 4.0）`.
Link Hiroshima's statement to the source URLs provided in the workbook
(`https://www.sabo.pref.hiroshima.lg.jp/portal/agreeGISAll.aspx`,
`https://hiroshima-dobox.jp/index2`) and Nagasaki's to
`https://data.bodik.jp/dataset/420000_doshasaigaikeikaikuiki` and
`https://creativecommons.org/licenses/by/4.0/deed.ja`.

This is not a restriction inferred solely from downloading A33 vectors: each
of the three **raster** entries in the GSI catalogue explicitly says
`データの利用にあたっては、国土交通省の「国土数値情報ダウンロードサイトコンテンツ利用規約」及び国土数値情報ダウンロードサイト「このデータの使用許諾条件」に記載の各都道府県が定める利用条件に同意の上ご利用ください。`
That incorporates the A33 conditions into use of these chosen tiles. The
workbook's Kyoto row says exactly
`・データの二次利用における制限（商用利用不可）。`

The catalogue permits public website/app use (commercial or noncommercial in
general); the Kyoto condition removes commercial secondary use from that grant.
Thus a **genuinely noncommercial** public deployment is supported by the
published conditions, subject to attribution and all other applicable terms.
The sources do not define whether this particular Gensai deployment qualifies
as noncommercial; no business model or deployment status was established in
this ticket. **Owner confirmation is required before Kyoto landslide delivery
or release.** This ADR does not choose a noncommercial business model, grant
commercial Kyoto permission or authorize silent geographic exclusion. If the
owner intends commercial use, obtain permission or explicitly revisit release
scope and explain any exclusion separately from mapped hazard absence.
The underlying A33 page prohibits statutory
real-estate important-matters explanations/supporting evidence use, warns that
not every zone is included, and describes approximate **1:25,000–1:50,000**
accuracy. Gensai provides neighborhood inspection, not legal boundaries.

## Coverage policy and verified limitations

Coverage follows the glossary: extent for which information is supplied, not
the colored hazard footprint. [FAQ Q23–24][faq] explicitly says absent display
can mean no predicted hazard **or data not yet prepared**; portal publication
lags new source maps because checks take time. Enlarging the display does not
increase source accuracy; background maps also contain errors. Direct residents
to municipality hazard maps and responsible authorities for current details.

Keep beside the legends: **“No colour does not mean safe. Data may be missing.”**
Japanese: **「色がない場所も安全とは限りません。データが未整備の場合があります。」**
No property verdict, point summary or computed score follows from these tiles.

Verified at retrieval:

- National maximum-scale river catalogue count: **448 rivers**.
- Prefectural maximum-scale catalogue counts: **1,718 prefectural rivers plus
  8,860 other rivers**. All 47 endpoint codes exist in the listing, but its
  notes say only some prefectural data are distributed, with preparation and
  permissions still incomplete. Counts do not prove complete geographic coverage.
- Tokyo source maps leave depths **under 0.1 m uncolored**; the catalogue says
  the portal mirrors that representation. Do not interpret these pixels as safe.
- Tsunami portal [publication table][tsunamitable] lists **40 prefectures**;
  its [CSV][tsunamicsv] says Tokyo is **islands only**, and splits Hokkaido
  coastlines into three entries. The open catalogue lists only **39** prefecture
  paths: `01–08, 12–18, 21–24, 26–28, 30–47`.
  Ibaraki (09) is published in the portal CSV but not listed for open tile
  delivery. Do not invent a `/09/` endpoint or assume the aggregate includes
  non-open Ibaraki data. The aggregate is the open product, not the whole portal.
- A33 lists national data, but expressly does **not** include every designated
  zone; designation/removal updates are not reflected immediately. Its workbook
  has prefecture-specific source dates. The 2025 edition is not evidence that
  all sources are contemporaneous.

None of these lists supplies verified polygons delimiting all places with
unavailable data. Do **not** hatch entire prefectures, outside colored pixels,
or outside successfully fetched tiles. Show textual publication/licensing
limitations and unknown geographic coverage until authoritative boundaries can
be verified. A request failure, timeout or 404 is not a coverage polygon or a
safety observation. Separate basemap/hazard pending and failed states and
individual sublayer failures; available layers remain usable. All-off means
“no categories enabled,” not “no hazards.”

## Verification and handoff limits

Issues #20 and #11, including comments, were read with `gh issue view --comments`
(both had zero comments). TDD and domain-modeling guidance were loaded. This
ticket delivers only this ADR: there is no application behavior seam to run
red/green tests against. Evidence checks replace artificial documentation tests.

Live HTTP GETs returned 256 × 256 PNGs for:

- Pale, national river and prefectural river (13), at `12/3638/1612`.
- Pale, national river, prefectural river (04) and tsunami aggregate, at
  `12/3651/1577`.
- Each of the three landslide paths (13), at `8/226/102`
  (29, 39 and 8 nontransparent pixels respectively).

Pale plus the three depth sources at the Sendai sample were visually inspected:
native yellow/peach/pink hazard areas are distinguishable against muted roads
and gray labels. Official legend PNGs were inspected and interior RGBA samples
recorded for the tables above. Low-depth neighboring swatches are similar; text
ranges are necessary and color alone is insufficient.

Tsunami at the Tokyo sample and all three landslide paths at the Sendai sample
returned 404; these were **not** converted into coverage claims. Catalogue
confirmation and successful samples establish access, not service reliability,
all-zoom completeness, all-prefecture licensing clearance or national coverage.

The implementation tickets must verify this composition with real overlapping
tiles, all eight category combinations, detailed landslide boundaries, readable
bilingual legends, both application themes and phone/computer layouts. This ADR
does not claim an unbuilt UI has passed those acceptance checks. Recheck the
catalogue, terms, conditions workbook and coverage notes before release; if
source conditions change, revise this decision rather than silently substitute
datasets or assert new coverage.

[catalogue]: https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html
[tiles]: https://maps.gsi.go.jp/development/ichiran.html
[depthlegend]: https://disaportal.gsi.go.jp/hazardmap/copyright/img/shinsui_legend3.png
[debrislegend]: https://disaportal.gsi.go.jp/hazardmap/copyright/img/keikai_dosekiryu.png
[slopelegend]: https://disaportal.gsi.go.jp/hazardmap/copyright/img/keikai_kyukeisya.png
[slidelegend]: https://disaportal.gsi.go.jp/hazardmap/copyright/img/keikai_jisuberi.png
[portalterms]: https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/copyright/copyright.html
[a33]: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A33-2025.html
[mlitterms]: https://nlftp.mlit.go.jp/ksj/other/agreement.html
[conditions]: https://nlftp.mlit.go.jp/ksj/gml/codelist/A33_permision_R7.xlsx
[faq]: https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/faq/faq.html
[tsunamitable]: https://disaportal.gsi.go.jp/hazardmap/copyright/tsunami_sinsui.html
[tsunamicsv]: https://disaportal.gsi.go.jp/hazardmap/copyright/csv/tsunami.csv
