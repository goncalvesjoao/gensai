# Muted basemap verification (#22)

Scope: basemap only, under #11 and the source/composition decision in
`docs/adr/0001-official-hazard-sources-and-composition.md`. Hazard switches,
legends and hazard composition are owned by other tickets.

## Test-first public workflow

The new production-browser test initially failed because the rendered map
requested `xyz/std` rather than the ADR's `xyz/pale`. After replacing the source,
it passed against Astro preview: native pale tile requests, source zoom 2–18,
map maximum zoom 17, visible linked `地理院タイル（国土地理院）` attribution,
and working zoom navigation.

Existing selected-location browser tests also passed: delayed boundary loading
and failure, English/Japanese, phone/computer, coordinate and pointer selection,
keyboard navigation/selection, markers, theme changes and responsive resizing.
The basemap remains native pale in both application themes.

## Official swatches against the basemap

On 2026-10-06, live GETs returned HTTP 200 for native 256-pixel pale tiles at
`12/3638/1612` (Tokyo) and `12/3651/1577` (Sendai), and the four original official
legend PNGs linked by the ADR: `shinsui_legend3.png`, `keikai_dosekiryu.png`,
`keikai_kyukeisya.png` and `keikai_jisuberi.png`.

Visually compared all eight ADR depth swatches (shared by tsunami and flooding)
and all twelve landslide swatches against both pale tiles, alongside the
original legends. Yellow/peach/pink depth fills and yellow/orange/red landslide
fills stand apart from muted gray roads and labels. Low-depth neighboring
swatches remain similar to each other; category labels and textual ranges are
still necessary. Planned-designation dark-blue dashed outlines in the official
legends remain distinguishable. This comparison is not a claim of color-only
accessibility or a verification of future hazard rendering/composition.

No recoloring, opacity changes or theme-specific basemap processing were added.
Kyoto commercial landslide reuse needs the owner's decision in the ADR; that
restriction does not block this attribution-only real-time pale basemap.
