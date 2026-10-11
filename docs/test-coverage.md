# Test execution and coverage

`npm test` builds once, runs Vitest checks in Node and jsdom environments,
then runs a small browser integration suite against managed preview.
`npm run test:react` provides the shortest behavior-test loop without a build.

`npm run test:visual` runs the language/theme/viewport layout checks separately.
`npm run test:all` runs the default suite and the visual suite with one build.
Run the visual suite for layout changes and before release. Production-host
verification and live Photon/hazard-provider probes remain separate commands.

The default suite targets 30 seconds on the development machine. Measure the
whole command before adding more full-map journeys. Exhaustive outcome tables
belong in Vitest Node or jsdom tests; browser tests prove integration and rendering.
This is a planning budget, not a hardware-dependent timing assertion.

## Execution

React Testing Library renders the actual address and device modules in jsdom.
The tests supply fetch and geolocation responses and observe public DOM state
and selected-location events. They use the actual Japan validator except for
explicit failure scenarios. Production modules were not extracted or rewritten.
jsdom cannot prove visual placement or WebGL output.

Browser files run with up to three workers. Each file shares Chromium; each page
owns an isolated context. Local provider requests use fixtures, with page-level
scenario overrides for delays, failures and colours. Live probes explicitly
enable their providers. Diagnostic screenshots are opt-in via `SCREENSHOT_DIR`;
canvas screenshots used to assert rendered colours remain mandatory.

## Assertion map

| Behavior                                                                                                                                                                      | Fast checks                                                                                                                                             | Browser integration                                                                                    | Visual checks                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Mainland, islands, overseas, ocean, holes and invalid coordinates                                                                                                             | Node `selected-location.test.mjs` retains all geography cases                                                                                           | Delayed boundary import/races plus one complete mainland/island/rejection journey                      | Short selection journeys check translated status placement and marker centering                          |
| Provider request language, valid single result, empty/foreign results, HTTP/network failures, response shape, invalid coordinates/geometry/country/label and boundary failure | React `location-controls.test.jsx` covers both languages against actual submission code                                                                 | Enter submission selects a marker; typing/device activation do not submit                              | Short address-choice journeys check long translated labels, panel size and focus appearance              |
| Ambiguity, suggestion cap, label deduplication, input focus and Japanese composition                                                                                          | React checks emitted selection, limit explanation, label details and composition prevention                                                             | Native keyboard chooses explicit matches; capped suggestions remain explicit                           | Both themes and menu states retain focused choice selection and map centering                            |
| Cancellation and readiness                                                                                                                                                    | React checks disabled controls until map readiness, aborted older query, late device callbacks and empty submission preserving a pending device request | Bundled-module delays and cross-module search/device/map races remain                                  | Layout tests do not repeat exhaustive race cases                                                         |
| Device mainland/island success, permission denied, unavailable, timeout, overseas, absent geolocation and boundary failure                                                    | React checks both languages, labels, Tokyo fallback explanation, request freshness/options, busy state and editable input                               | Explicit activation, lazy boundary loading, repeated fresh requests and stale-callback rejection       | Representative success and denied-permission fallback remain correctable in each language/viewport/theme |
| Locale paths and query/hash preservation                                                                                                                                      | Node locale tests                                                                                                                                       | Actual menu selection, home destination and map/home navigation                                        | Preferences matrix retains localized navigation and visible control placement                            |
| Welcome content and no initial redirect/location request                                                                                                                      | Node static output checks                                                                                                                               | Welcome navigation with JavaScript disabled, both languages/themes/viewports and no device acquisition | No separate duplicate welcome journey                                                                    |
| Pre-paint theme, invalid/saved preferences and blocked storage                                                                                                                | Node executes built scripts and checks theme tokens                                                                                                     | Actual hydrated toggles and unavailable-storage behavior                                               | Preferences matrix checks both themes and control/scale placement                                        |
| Hazard switches and retained selection                                                                                                                                        | jsdom checks emitted switch events for all eight combinations                                                                                           | Native keyboard/focus and persistence; pixels check all combinations                                   | Hazard journey checks menu/resize persistence, visible warnings, legends and unoccluded controls         |
| Official source colours and drawing order                                                                                                                                     | Configuration checks cannot prove rendered pixels                                                                                                       | All eight canvas RGB assertions remain mandatory                                                       | No duplicate pixel matrix                                                                                |
| Tile delays, partial failures, 404 versus 500, cached pan recovery, all-off explanation and readiness                                                                         | No shallow status-helper substitute                                                                                                                     | Every hazard-layer scenario remains                                                                    | No repeated tile-failure matrix                                                                          |
| Worker URL and static imports                                                                                                                                                 | Node checks emitted worker responses and JavaScript MIME types                                                                                          | Map loads throughout integration                                                                       | Map renders throughout visual checks                                                                     |
| Test setup isolation                                                                                                                                                          | None                                                                                                                                                    | Regression checks Chromium sharing, cookie isolation and context cleanup                               | Uses the same verified setup                                                                             |

The former address-outcome matrix repeated response validation, device selection
and correction inside every visual combination. Exhaustive outcomes now live in
React tests; the visual replacement concentrates on focus, long labels, panel
placement, selected-location visibility and centering through resize. Device
visual checks use success and denied-permission fallback instead of every error.
The existing hazard, preferences, menu and selected-location layout assertions
remain in the separate visual suite.

## Measured runs on 2026-10-10

On the development machine, the previous complete browser run took 207 seconds.
After this split, `npm test` took 29.85 seconds including React checks, build,
Node checks and browser integration. Its browser portion took 24.55 seconds.
The full default-plus-visual run took about 85 seconds, with 53 seconds spent
in the visual suite. These measurements compare different default workloads;
visual coverage still runs with `test:all`, rather than disappearing.

All 118 checks passed across React, Node, browser integration and visual suites.
The two live-provider probes were intentionally skipped; deployed-host checks
were not part of these local runs. Timings vary with hardware and concurrent work.
