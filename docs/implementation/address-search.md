# Address search provider verification

Verified on 2026-10-06 for [spec #10](https://github.com/goncalvesjoao/gensai/issues/10) and [ticket #17](https://github.com/goncalvesjoao/gensai/issues/17), before integration. The acceptance boundary is the visible map on the public English and Japanese URLs.

## Provider and conditions

The implementation uses Photon at `https://photon.komoot.io/api/`. [Photon's terms](https://photon.komoot.io/) permit use for projects at reasonable request volume. The [provider repository](https://github.com/komoot/photon#demo-server) warns that heavy usage can be throttled or banned and offers no availability guarantee. There is no published numeric allowance. Search submits only on Enter, with no autocomplete, background polling or retries. It cancels superseded requests and times out after ten seconds. Recheck terms and volume before deployed acceptance; move to a hosted/private instance if public-service capacity becomes insufficient.

[Photon's API documentation](https://github.com/komoot/photon/blob/master/docs/api-v1.md) defines free-form address/name search, a country-code filter, result limits and language preferences. Requests use `countrycode=JP`, `limit=10`, and no device/map-position bias. English uses `lang=en`. The public service accepts `lang=default` and returns Japanese local names for the tested Japanese places. English names may still include untranslated address components. This is an observed service behavior, not a guarantee that every OSM name is translated.

The data is OpenStreetMap under [ODbL](https://www.openstreetmap.org/copyright). The search panel credits OpenStreetMap contributors and links to its copyright/license page, alongside Photon. Search results remain transient in the current page; the implementation does not redistribute an address database. New redistribution or database reuse needs an ODbL review. Photon software's Apache-2.0 license is separate from OSM data licensing.

Nominatim was also checked. Its public service has an [application-wide one request per second limit](https://operations.osmfoundation.org/policies/nominatim/); a static browser application cannot guarantee that global limit. Photon was selected instead.

## Actual query checks

Requests to the real service used the above Japan filter and ten-result limit. Python urllib requests independently checked these responses, apart from controlled browser tests:

| Query                                            | Language     | Observed result                                                            |
| ------------------------------------------------ | ------------ | -------------------------------------------------------------------------- |
| `東京都 新宿区 西新宿 2 8 1`                     | default      | Ten matches; 東京都庁 at 139.6929973, 35.6897391, house number 1           |
| `2 8 1 Nishishinjuku Tokyo`                      | en           | Ten matches; Tokyo Metropolitan Government Office at the same point        |
| `西新宿` / `Nishishinjuku Tokyo`                 | default / en | Nishi-Shinjuku area and station matches; ambiguous                         |
| `与那国町` / `Yonaguni`                          | default / en | Yonaguni at 123.0044413, 24.4679356 plus other island places               |
| `那覇市`                                         | en           | Naha at 127.6791452, 26.2122345 plus nearby named places                   |
| `Chichijima`                                     | en           | Two Ogasawara island matches near 142.20957, 27.07089                      |
| `府中`                                           | en           | Multiple matches across Tokyo, Hiroshima and Tokushima                     |
| `Seoul`                                          | en           | Japan businesses with Seoul in their names; no Korean destination returned |
| `東京都新宿区西新宿2丁目` / `東京都新宿区西新宿` | en           | No matches                                                                 |

The last row is a real limitation. Photon supports Japanese and Latin address components, but some concatenated Japanese addresses and missing OSM house numbers fail. Results may describe a locality, building or nearby named place, rather than an exact home. The UI offers a shorter address or map-point correction and never treats a provider match as an exact house-number guarantee. The ten-result cap bounds the returned suggestions; it does not prove the query has no further matches.

Both country codes and coordinates are validated. Even a provider result marked JP must pass the same Japan land-boundary check as map-point selection. Returned island coordinates are supported by that boundary, but these checks do not establish exhaustive address or island coverage.

## Repeatable checks

`tests/browser/address-search.test.mjs` uses controlled HTTP responses through the rendered map. It covers Enter-only submission, typing, independent device activation, single-match labels and markers, islands, unsupported results, ambiguity refinement, failure/malformed responses, keyboard focus, languages, themes, viewport sizes, sidebar states, correction and obsolete responses. Selection-start events invalidate requests at the start of any newer selection intent, including delayed Japan-boundary work.

Run browser tests against a production preview with `TEST_URL`, `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` pointing to an existing runtime. `REAL_PROVIDER=1 node --test --test-name-pattern='real Photon' tests/browser/address-search.test.mjs` separately exercises actual requests from the browser, verifying CORS and Japanese/Latin/mainland/island result presence. These real checks are opt-in to avoid using the public service during routine tests.

Hazard categories are not implemented in this baseline, so retained-category and final deployed acceptance belong to their later specs.
