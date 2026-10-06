# Hazard delivery seam (#23)

`src/lib/hazard-layers.mjs` is the registry used by both the renderer and the
visible legends. Tsunami is the only delivered category. The immutable
`hazardCategories` store remains resident intent: request results never write it.
Flooding and landslide switches do not currently register or fetch future data.

## Adding a source

Add one descriptor per independently reported sublayer with a unique `id`,
`category`, numeric `order`, bilingual `title`, `legend`, `attribution`, and
`tiles`. `tiles` can be an array of XYZ templates or a function receiving numeric
`{ z, x, y }` and returning templates for that tile's viewport. A prefectural
source must resolve every intersecting prefecture, not just the selected point,
and return them in ascending code order. An empty array is not a safety verdict.

ADR0001 bottom-to-top order: prefectural river, national river, tsunami (30),
landslide zones, debris-flow zones, steep-slope-collapse zones. Legend colors,
dates, names, attributions and source-specific restrictions must come from that
ADR. Adapt `HazardLegends` for the source's coverage/provenance explanations
rather than applying the tsunami publication limitations to other categories.
Landslide delivery still requires the owner's licensing decision for Kyoto:
this seam does not authorize fetching commercially restricted data.

`createHazardRenderer(map, report)` is the shared rendering boundary. It creates
one raster through a MapLibre protocol, fetches official PNGs, and takes the
uppermost nontransparent RGBA pixel in deterministic registry order. Transparent
pixels expose the next source; selected pixels composite against the basemap,
not a lower hazard. Nearest raster sampling, opacity 1 and no fade avoid adding
display colors. Do not add ordinary separate hazard raster layers.

`setLayers(definitions)` invalidates the old generation before removing the
rendered layer and aborts outstanding fetches. Both request completion and PNG
encoding check the generation; old responses cannot restore disabled intent.
`dispose()` releases protocol registration and cancels requests. Each descriptor
reports loading/loaded/failed separately; a failed sublayer leaves available
source pixels usable. Failures stay visible until a new enabled-set generation
or reload, so one successful tile does not erase a partial failure. Request
failure, transparent success and unknown geographic coverage are distinct.

## Verification

Run a built preview, not Astro dev in an isolated checkout with ancestor
`node_modules`: Vite's filesystem allow-list can prevent React island hydration.

```sh
npm run build
npm run preview -- --host 127.0.0.1
# In another terminal, supply external browser paths:
PLAYWRIGHT_MODULE=/path/to/playwright \
CHROMIUM_PATH=/path/to/chromium \
node --test tests/browser/*.test.mjs
```

`tests/browser/tsunami.test.mjs` verifies the public application with controlled
official tile responses, English/Japanese phone layouts, native legend colors,
menu-independent interpretation, pending disable and failures. Set
`LIVE_OFFICIAL=1` to additionally retrieve/decode the real official Sendai
`12/3651/1577` sample and confirm mapped pixels in a 256 × 256 PNG. This is
access evidence, not a national-coverage claim.

`tests/browser/hazard-renderer.test.mjs` bundles a browser harness using the
public renderer API with synthetic sources. It proves source ordering despite
reverse registration, partially transparent upper pixels over the basemap
(not the lower hazard), fully transparent fallback, failed-upper fallback,
and disabled stale response safety. It does not substitute for follow-on
real overlapping official flood/landslide tile checks.
