# Browser acceptance coverage inventory

The verification changes in [spec #48](https://github.com/goncalvesjoao/gensai/issues/48)
preserve the existing rendered-behavior assertions. Routine cases use local previews
and `tests/browser/fixtures.mjs`; controlled provider responses are installed before
case-specific routes so deliberate errors, coloured tiles and search results remain
authoritative for those cases. Unexpected external requests fail routine acceptance.

| Browser file                  | Preserved acceptance scope                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `welcome.test.mjs`            | English/Japanese welcome routes, phone/computer layouts, both appearances, navigation and no unsolicited location requests                            |
| `theme-modes.test.mjs`        | Welcome/map route matrices, System/Light/Dark selection, restoration, unavailable storage, live System changes, first-paint appearance, map pixels    |
| `floating-controls.test.mjs`  | Language/theme controls, phone/computer layouts, storage restoration, home/map navigation                                                             |
| `address-search.test.mjs`     | Controlled search responses, errors and cancellation, chooser keyboard and pointer interactions, language/viewport/theme matrices, location selection |
| `device-location.test.mjs`    | Permission/error/success behavior and language/viewport/theme matrices                                                                                |
| `selected-location.test.mjs`  | Boundary loading/failure, location retention and marker behavior, bilingual phone/computer layouts and themes                                         |
| `hazard-layers.test.mjs`      | Readiness/failure/404 distinction, source composition and official colours, independent categories, legends and no safety verdict                     |
| `hazard-menu.test.mjs`        | Bilingual phone/computer menus, themes, legends, source details and selected-location interaction                                                     |
| `hazard-switches.test.mjs`    | Independent hazard categories in English/Japanese                                                                                                     |
| `hazard-exploration.test.mjs` | Bilingual phone/computer/theme exploration, selected-location retention, drag/zoom controls and category pixels                                       |

## Explicit external probes

- `REAL_PROVIDER=1`: the existing address-search live Photon probe, with its assertions retained.
- `REAL_HAZARDS=1`: the existing official-raster live probe, with its source responses and rendering assertions retained.
- `PRODUCTION_ACCESS=1`: the two existing deployed entry-point/navigation probes in `production-access.test.mjs`, with their HTTPS, redirect, language and location-request assertions retained.

These probes are separate evidence and are skipped unless explicitly enabled. Routine
acceptance never substitutes fixtures into these live cases. A skipped probe is not
a provider pass. The production checks previously ran by default; they now require
the explicit opt-in above. Local cases and matrices remain in the routine gate.

## Fixture interpretation

Default tiles provide a pale `[240, 240, 240]` basemap and transparent hazard pixels;
default search provides an empty result. Tests that assert hazard colours, drawing
order or search behavior supply their existing controlled responses instead. This
preserves [ADR 0001](adr/0001-official-hazard-sources.md): fixture success establishes
rendering/interaction, not official availability, nationwide coverage or safety.
The application still uses its official sources and original palettes. No resident
behavior or attribution is changed by these fixtures.

## Evidence and runtime comparisons

Compare the same local cases, languages, viewports, routes and themes before and
after migration. Record separately the opt-in probe differences above, skipped or
canceled checks, environment, tested revision/build and command. Do not count an
interrupted or changed-checkout run as completed acceptance evidence. The integration
implementation report records the actual completed validation and timing evidence;
this inventory alone makes no runtime claim.
