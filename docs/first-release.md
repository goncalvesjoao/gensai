# First release

This document defines the release's audience, outcome, scope and exclusions.
The [product specs](specs/index.md) contain detailed behavior, acceptance criteria,
dependencies and open decisions. Both are framework-independent; delivery status
belongs to the implementation being built.

## Audience and outcome

Prioritize current residents preparing before a disaster in Japan. Help them
choose a home, workplace or another selected location and inspect the official
mapped hazards around it. Current location and selected location are distinct.

## In scope

- A map experience with bilingual routes, theme preferences, accessible controls
  and a responsive sidebar.
- Location selection throughout Japan, including its islands, through an explicit
  device-location action, address search or a point on the map.
- Japanese-script and Latin-character address queries with ambiguity handling and
  correction of the selected point.
- Explained Tokyo fallback when device acquisition fails or the position is
  outside Japan.
- Three official hazard categories: maximum-scale river inundation depth,
  tsunami inundation depth, and landslide warning zones for debris flow,
  steep-slope collapse and landslide hazards.
- A selected-place marker and label, category legends, attribution, verified
  coverage information where available, and separate loading/failure explanations.
- English and Japanese throughout the workflow on phones and computers, with
  keyboard access, visible focus and an internet connection.
- Selection retained for the open-page experience, without saved places.
- HTTPS production access through a dedicated map host, with the main entry point
  redirecting to the equivalent map route.

An uncoloured area does not establish safety or missing coverage. Keep
"No colour does not mean safe. Data may be missing" prominent beside the legend.
Do not offer an automatic property verdict, calculated hazard score or textual
point summary.

The feature specs take precedence where they change the intermediate baseline.
A full-release rebuild uses explicit location permission, functioning search and
official hazard exploration directly. It need not recreate automatic startup
permission or placeholder search.

## Outside this release

Preparation guides, evacuation planning, live alerts, offline maps, saved places,
shareable map state, accounts, additional launch languages, property verdicts,
hazard scores and textual point summaries are excluded.

Deferred hazard layers include inland flooding, storm surge, flood duration,
flood-flow building-collapse zones, riverbank erosion, design-scale river
flooding, avalanche danger, earthquake shaking and liquefaction. Earthquake and
liquefaction data require separate source research.

Use the [glossary](../GLOSSARY.md) for domain terms and the named feature specs for
implementation decisions and release checks. Provider and technology choices are
open; changing the confirmed product scope requires another product decision.
