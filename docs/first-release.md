# First release

Status: scope confirmed by the product owner on 2026-10-05; URL and redirect
requirements updated on 2026-10-06.
This document describes planned behaviour, not implemented functionality.
Domain terms are defined in [GLOSSARY.md](../GLOSSARY.md).

## Audience and outcome

The first release prioritizes current residents preparing before a disaster.
They can find a selected location and explore the mapped hazards around it.
Home is the primary use case; workplaces and other locations work the same way.

## URLs and entry point

The Gensai map lives at the root of a dedicated map subdomain. The Gensai entry
point redirects visitors to the map for this release instead of showing a welcome
page.

| Environment | Gensai entry point       | Gensai map                   |
| ----------- | ------------------------ | ---------------------------- |
| Production  | `https://gensai.help/`   | `https://map.gensai.help/`   |
| Development | `http://localhost:4321/` | `http://map.localhost:4321/` |

Development uses the same port on both hosts. If the development server uses a
port other than 4321, use that port for both URLs.

English is unprefixed and Japanese uses `/ja` on the map subdomain. Redirect the
Japanese entry point at `/ja` to the map subdomain's `/ja` route. Language switching
keeps visitors on the map subdomain. The map URL does not require a `/map` path.

## Geographic scope and location selection

- Support locations throughout Japan. Restrict address results and location
  selection to Japan.
- Keep map navigation focused on Japan. Neighbouring geography may remain
  visible near the edges, particularly when zoomed out.
- Allow selection through device location, address search, or a point on the map.
- Accept Japanese-script addresses and addresses entered in Latin characters.
  Let users choose among ambiguous results and correct the selected point.
- Treat current location and selected location as distinct concepts. A resident
  checking from an office or overseas can inspect a home in Japan.

## Startup and location permission

Start with an overview of Japan. Request device location only when the user
chooses "Use my location".

If permission is denied or the device is outside Japan, explain the situation
and keep address search and map selection available. A fallback position must
not be presented as the user's current location.

## Hazard categories

Use these five official hazard layers, presented as three categories:

| Category          | Layers                                                                                |
| ----------------- | ------------------------------------------------------------------------------------- |
| River flooding    | Assumed maximum-scale inundation depth, combining national and prefectural river data |
| Tsunami           | Estimated inundation depth                                                            |
| Landslide hazards | Debris flow, steep-slope collapse, and landslide warning zones                        |

Select tsunami initially. Show one category at a time. Within landslide hazards,
show the three types together with legend entries that distinguish them.
Preserve the chosen category when the selected location changes.

Show a marker, the selected place, and the active category's readable legend.
Users inspect the surrounding hazard colours. The first release provides no
automatic property verdict, calculated hazard score, or textual point summary.

## Colours, coverage, and loading states

Use a muted basemap beneath the official hazard colours. Keep this explanation
prominent alongside the legend in both launch languages:

> No colour does not mean safe. Data may be missing.

Use distinct shading or hatching for unavailable coverage only where its
boundaries can be verified. An uncoloured area alone does not identify missing
coverage. Show verified coverage information where available and identify
loading failures separately.

Supporting location selection throughout Japan does not imply complete
hazard-data coverage throughout Japan.

## Languages, devices, and connectivity

- Launch in English and Japanese, including controls, legends, and coverage
  explanations.
- Support the full workflow on phones and computers. On phones, controls must
  leave enough map visible to inspect the surroundings.
- Require an internet connection. Explain failures to load the map, address
  search, or hazard layers.
- Keep selection while the page is open. Do not retain it after the page closes.

## Outside this release

Preparation guides, evacuation planning, live alerts, calculated point summaries,
offline maps, saved places, and shareable map links are outside this release.

Deferred hazard layers include inland flooding, storm surge, flood duration,
building-collapse zones from flood flow and riverbank erosion, design-scale
river flooding, and avalanche danger sites. Earthquake shaking and liquefaction
are outside this release and require separate data-source research.

## Sources and remaining checks

The [Hazard Map Portal open-data catalogue](https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html),
reviewed on 2026-10-05, lists the selected layers, official legends, tile URLs,
and coverage notes. Its publication coverage differs by layer.

[GSI's FAQ, Q23–24](https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/faq/faq.html)
explains that absent hazard display may reflect missing data, that publication
can lag source updates, and that zooming in does not establish greater accuracy.

Before implementation is considered ready for release:

- Verify that the map loads directly on its production and development hosts and
  that the entry point redirects to the corresponding map host, including `/ja`.

- Select an address-search provider and verify Japanese-script and Latin-character
  queries, result ambiguity, and restriction to Japan.
- Verify the chosen tile endpoints, legends, attribution, and applicable reuse
  conditions against the official sources.
- Establish what coverage information can actually be verified before adding
  coverage shading or making location-specific coverage claims.
- Select a geographic boundary method that supports Japan's islands and the
  agreed restriction on location selection.

These checks resolve implementation details; they do not change the confirmed
release scope without another product decision.
