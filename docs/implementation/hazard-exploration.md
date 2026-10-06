# Hazard exploration verification

Implementation for [spec #11](https://github.com/goncalvesjoao/gensai/issues/11), with source decisions in the [official hazard sources ADR](../adr/0001-official-hazard-sources.md). Verification uses the rendered English and Japanese map routes. This feature does not establish first-release production readiness; map-controls and integrated release acceptance remain separate specs.

## Sources and coverage

The ADR records live official endpoint checks, sampled legend colours, supported zooms, reuse conditions, required credits and representative source composites. Flooding uses GSI's combined national/prefectural raster with the national raster above it. Each enabled source keeps its own official colours. Later layers can hide earlier ones; the interface explains the order and independent switches allow inspecting each category separately.

Uncoloured pixels and unsupplied tiles do not establish coverage boundaries. No authoritative geographic unavailable-coverage boundary was verified, so the implementation does not hatch inferred missing-data areas. The warning remains visible alongside legends, including when all categories are off. Publication can lag municipal updates, and enlargement does not increase source accuracy.

## Repeatable acceptance

Run `npm test`, `npm run lint` and formatting checks. Browser tests use an existing Playwright runtime and Chromium installation, without adding an application dependency. Set `TEST_URL` to the production preview, `PLAYWRIGHT_MODULE` to the installed Playwright module, `PNG_MODULE` to the installed pngjs module and `CHROMIUM_PATH` to the browser executable, then run:

```sh
node --test --test-concurrency=1 tests/browser/*.test.mjs
```

`hazard-switches.test.mjs` checks all eight independent switch combinations, keyboard operation and focus, menu/layout/location retention, and fresh-page defaults in English and Japanese. `hazard-layers.test.mjs` exercises official-source loading, category/legend synchronization, ordering, disabled stale responses, unknown coverage and partial failure through the visible map. Controlled tile responses establish repeatability separately from the ADR's actual official-source verification.

`hazard-exploration.test.mjs` exercises phone/computer layouts in both languages and themes. It selects coordinates, an address, the device location and a map point while all categories are enabled, checks retained switch state and menu visibility, and confirms that the closed-menu legends remain available below the map, outside map controls and the scale. Screenshots are written to `/tmp/gensai-hazards-*.png` for visual inspection.

## Results

Verified on 2026-10-06 against the scoped publication branch. The production build, ESLint, scoped Prettier checks and `git diff --check` passed. All 19 unit checks and 39 controlled browser checks passed. Two opt-in source tests were skipped in that controlled run; the real hazard test then passed separately with `REAL_HAZARDS=1`. The earlier real address-provider verification remains documented with address search.

The visible pixel check exercises all eight enabled combinations against fixed official palette colours. It confirms national flood precedence, tsunami above flooding, landslide composition, opaque source colours and the explicit all-off message without reading map internals. The EN/JA phone/computer matrix covers both themes, all selection methods, retained controls, closed-menu legends, and actual occlusion checks for the warning, scale and zoom controls. Sixteen open/closed menu screenshots were captured. Representative phone layouts were visually inspected, including longer Japanese labels and the dark theme.

Live browser requests exercised all six official hazard raster endpoints around Tokyo and coastal/slope locations near Kamakura. The browser displayed actual official colours, a selected-location marker and separate missing-tile explanations. The final live screenshot was `/tmp/hazards-live-kamakura.png`. These representative checks do not establish complete nationwide coverage.

## Standards review

One finding required the municipal-map publication link specified by the ADR. The interface now links the official municipal directory in both languages. The reviewer confirmed the correction; no remaining standards finding was reported.

## Spec review

Two findings required fixes. Cached failed tiles could become "loaded" after a small pan without a successful request, and basemap 404s lacked an explanation. The shared raster request handling records outcomes by URL and derives status from MapLibre's public visible-tile API. Cached 404/500 outcomes remain failures while the relevant tiles are visible; actual successful tiles in a new viewport restore the loaded state. Missing basemap tiles show a separate message while available hazard tiles remain usable.

Three browser regressions failed before these corrections and passed afterward. Both findings were re-reviewed and confirmed resolved. Initial feature checks also failed before switches, layers, legends and the no-colour warning existed. The phone warning and scale occlusion checks failed before their layering and compact-attribution corrections.

Production hosting, the floating-control redesign and integrated first-release acceptance remain owned by their separate tickets. This evidence completes hazard exploration, not the whole first release.
