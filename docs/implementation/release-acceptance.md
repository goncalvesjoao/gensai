# First-release acceptance

Spec [#12](https://github.com/goncalvesjoao/gensai/issues/12), integrated ticket [#29](https://github.com/goncalvesjoao/gensai/issues/29), production ticket [#28](https://github.com/goncalvesjoao/gensai/issues/28).

## Repeat the deployed checks

Use installed Playwright, pngjs and Chromium; set `PLAYWRIGHT_MODULE`, `PNG_MODULE` and `CHROMIUM_PATH` when they are outside the checkout. No application dependency is needed.

```sh
TEST_URL=https://map.gensai.help HOME_TEST_URL=https://gensai.help \
  REAL_PROVIDER=1 REAL_HAZARDS=1 \
  node --test --test-concurrency=1 tests/browser/*.test.mjs
npm test
npm run lint
npm run format:check
git diff --check
```

Run against the reviewed deployment. `REAL_PROVIDER=1` enables actual Photon address searches; `REAL_HAZARDS=1` enables actual official raster requests. Neither check is replaced by controlled browser responses. Controlled tiles, provider responses and device positions exercise repeatable failure paths and layout; these do not establish national coverage or physical-device geolocation accuracy.

The existing browser suite covers the public welcome/map/home routes, English/Japanese, phone/computer widths and both themes. Feature checks exercise Japan overview without location acquisition, explicit acquisition and explained Tokyo fallbacks, Japanese/Latin Enter searches, ambiguity and correction, independent hazard switches, explicit menu dismissal, legends, attribution, unknown-coverage warnings, map/search/hazard failures and keyboard navigation. Selection persists in the mounted map only. Language navigation resets it to the overview, following the recorded decision in `selected-location.md`; reload and a fresh page also reset it.

## Evidence on 2026-10-07

Initial deployed checks targeted the main deployment at `0c2ea948beec751a929335f4580dd07e16e73d86`. Production welcome acceptance found that the entry-point host served the map; ticket #28 owns the correction and the welcome round-trip must pass after its deployment.

The floating-controls home-link regression initially failed because it expected the local preview's `/welcome` path on production. It now checks the complete locale-specific destination against `HOME_TEST_URL`; the deployed English/Japanese regression passed. The actual navigation function required no change.

Live Photon searches passed for `東京都 新宿区 西新宿 2 8 1`, `2 8 1 Nishishinjuku Tokyo`, `与那国町` and `Chichijima`. Expected places were present, returned candidates were Japanese, ambiguous results stayed unselected until explicit choice, and the chosen location appeared on the map. The first three returned ten candidates; Chichijima returned two. This verifies representative provider responses, not exhaustive or exact-address coverage.

The initial deployed map run finished with 48 of 49 checks passing, zero skipped. Actual official raster requests passed at Tokyo and two Kamakura selections: all six hazard endpoints produced responses and successful PNG tiles rendered. This representative probe does not prove national completeness or success for every endpoint at every selected point.

The Japanese 390 × 844 search/menu check timed out waiting for search choices; its focused retry passed. Investigation found that the address input accepted Enter before map selection initialized, while submission silently returned. A deterministic delayed-map browser regression failed against production. Disabling the existing native search input until map selection is ready made that regression pass against the corrected production build. The existing device button already follows this readiness condition. A complete deployed rerun after the correction is required; the successful retry alone does not establish readiness.

Build and all 15 Node checks passed. ESLint passed. Repository formatting initially failed for the pre-existing tracked implementation skill's YAML quotation style; a separate mechanical quote correction made the full formatting check pass. No skill instructions changed.

The corrected local production build passed all 19 controlled address/menu checks, including the new delayed-start regression, with the live Photon check explicitly skipped in this correction run. The home-destination regression also passed for both production origins and local preview destinations. The earlier deployed Photon probe remains separate evidence; deploy and rerun the complete suite before acceptance.

First-release readiness remains unverified until the production welcome correction and search readiness correction are deployed and the complete deployed browser run passes. Leave parent #12 open for its owner.
