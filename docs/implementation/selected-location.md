# Selected location

Implemented for #14 under [spec #9](https://github.com/goncalvesjoao/gensai/issues/9).

## Boundary evidence

Verified on 2026-10-06. The checked-in `src/data/japan-boundary.json` retains all 4,979 polygons and holes from geoBoundaries JPN-ADM0-22093344. Coordinates are rounded to six decimal places, about 0.1m. Source geometry was 160,361 vertices. No islands were removed or geometry simplified.

- [MLIT administrative area dataset](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v3_1.html) is the primary source, dated 2022 in the metadata.
- [geoBoundaries geometry](https://github.com/wmgeolab/geoBoundaries/blob/main/releaseData/gbOpen/JPN/ADM0/geoBoundaries-JPN-ADM0.geojson) and [metadata](https://github.com/wmgeolab/geoBoundaries/blob/main/releaseData/gbOpen/JPN/ADM0/geoBoundaries-JPN-ADM0-metaData.json) identify MLIT as source and CC BY 4.0 as license. Attribution: MLIT National Land Numerical Information and geoBoundaries, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Adaptation: geometry extraction and coordinate rounding. Original LFS SHA256: `8da994e4c3301fa3f2e51dcbc23025d61225e6c15ed9c85e4a063ebc1cd11af8`.
- [GSI extreme points](https://www.gsi.go.jp/KOKUJYOHO/center.htm) establish Yonaguni, Minamitorishima and Okinotorishima, with about one arcsecond uncertainty. The geometry includes inhabited offshore islands, Ogasawara and Minamitorishima. It also includes northern territories as represented in that source dataset. This is dataset coverage, not a statement about administration or territorial disputes.

Okinotorishima's southernmost rock is absent from the polygon dataset. Its GSI published point at 136 degrees 04 minutes 11 seconds E, 20 degrees 25 minutes 31 seconds N receives a 40m uncertainty allowance. This is an explicit small exception around that rock, not a rectangle accepting ocean between islands. The data's generalized coastline can reject points near changed or reclaimed shoreline. This validation is for selecting a land point, not a survey or legal territorial boundary.

## Visible behavior and choices

The initial map fits 122.5–154.5 E and 20–46 N, with 30px padding. Its minimum zoom is the fitted overview scale. Navigation constrains the center to that area and allows neighbouring geography at the viewport edges. A selected point uses at least zoom 12, preserving a person's closer zoom. The raster supports zoom 18. Keyboard users can pan with MapLibre's arrow keys and press Enter to select the center, or enter latitude/longitude in a native form. Pointer users click a point. Selection always uses the same finite-coordinate and polygon validation.

The readable label is localized "Selected location" plus five-decimal latitude/longitude. This avoids inventing an address without a provider. One red marker represents the selected location; the overview has none. A device-position fallback may select Tokyo with an explicit localized explanation supplied by the acquisition feature.

The selection exists only in the mounted map's memory. Theme, sidebar and resize interactions retain it. The language selector navigates to a fresh route and resets it to the overview, as does reloading or opening a new page. Selection is not written to storage, cookies, query parameters or fragments.

[GSI standard raster tiles](https://maps.gsi.go.jp/development/ichiran.html) replace the low-detail demo map. Basemap place names use GSI's Japanese labels on both routes; selection controls and descriptions are English/Japanese. Keeping the same detailed map supports streets and remote islands at selected-place scales. Attribution links to GSI's tile list and credits its shoreline source, NIMA/USGS VMAP0 (1997). Raster colors and labels retain their source contrast in both application themes.

## Selection integration

The visible map and coordinate form share the same flow used by later device/address methods. Dispatch `gensai:select-location` on `window` with `{ location: { lng, lat }, explanation?: string, label?: string }` in `event.detail`. The map validates the point, updates the existing marker and label, and responds with `gensai:selection-result` containing `{ valid, location }`. Invalid locations leave the selected point intact and display a localized correction message. `TOKYO` and `isJapanLocation` live in `src/lib/selected-location.mjs`; acquisition can check a position before deciding whether to send Tokyo fallback. None of these methods modifies hazard-category state.

## Verification

The browser test uses the built site's public URLs and actual controls/canvas. Run `npm run build`, serve `npm run preview`, then `node --test tests/browser/selected-location.test.mjs`. Playwright must be available in the environment or selected with `PLAYWRIGHT_MODULE`; `CHROMIUM_PATH` selects a preinstalled browser and `TEST_URL` selects the preview URL. No test dependency is added to the application. `SCREENSHOT_DIR` optionally records screenshots.

Verification completed: 17 existing Node tests and four browser scenarios passed. Each browser scenario covers both themes; eight rendered screenshots were inspected at `/tmp/gensai-spec-9/{en,ja}-{phone,computer}-{light,dark}.png`. The browser runs exercise Tokyo, Naha, Yonaguni, Chichijima, Minamitorishima and the GSI Okinotorishima point, then reject Seoul without replacing the previous selection. They use actual pointer and keyboard map selection, theme/menu/resize retention, language navigation reset and fresh reload.
