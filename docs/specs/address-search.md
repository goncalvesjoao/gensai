# Japanese and Latin-character address search

## Problem statement

Current residents need to find a supported place by address, including when their device is somewhere else. The baseline search field is only a visual placeholder.

## Solution

Provide functioning Japanese-script and Latin-character address search, limited to Japan, with ambiguity handling, readable request states and selection of the intended place.

## User stories

1. As a current resident, I want to search Japanese-script addresses, so that I can find my home using its local address.
2. As a current resident, I want to search addresses in Latin characters, so that I can find a place without entering Japanese script.
3. As a current resident, I want address results limited to Japan, so that I can choose a supported selected location.
4. As a current resident, I want to choose among ambiguous search results, so that I select the intended place.
5. As a current resident, I want clear search loading, no-result and failure states, so that I know whether to wait, revise the query or try again.
6. As a current resident, I want choosing an address to establish the selected location, so that I can inspect that place on the map.
7. As a current resident, I want to correct a selected address point on the map, so that I can inspect the intended position when a result is imprecise.
8. As a current resident, I want an older response to leave newer searches and selections intact, so that the map does not jump to an obsolete result.
9. As an English- or Japanese-speaking current resident, I want results and search explanations understandable in my chosen language, so that I can choose the correct place.
10. As a keyboard user, I want to enter a query and choose a result using the keyboard, so that I can complete address search.
11. As a current resident on a phone, I want usable query and result controls alongside the map, so that I can search on a narrow screen.

## Product decisions

This is a framework-independent product spec. No existing code, library, rendering architecture or testing tool is required.

- Accept addresses in Japanese script and Latin characters. Return supported results in Japan, including Japan's islands, rather than assuming device location is the destination.
- When multiple places match, let the person choose the intended result. A result becomes the selected location only through selection, not merely by typing an ambiguous query.
- Show pending, no-result and failed-request states separately. Explain failures in the active application language and keep device-location/map-point selection available.
- Obsolete query responses must not replace newer results or a more recent selected location.
- Choosing a result establishes its map point through the selected-location behavior in [selected-location spec](location-selection.md). Let the person correct it through map-point selection. Use the same Japan validation and selected-place presentation rules.
- Use accessible result controls with readable labels and visible focus. Query entry and result selection must work with a keyboard on phone and computer layouts, in English and Japanese and both application themes.
- Choose the address-search provider during implementation. Verify Japanese-script and Latin-character support, ambiguity behavior, Japan filtering, island coverage, usage limits, attribution and reuse terms before integration. No provider or query protocol is prescribed.

## Acceptance criteria

Use the complete visible feature and its public behavior as the acceptance boundary. Any suitable tools may be used; controlled device/provider responses allow repeatable checks without prescribing internal interfaces.

1. Japanese-script and Latin-character queries find the intended Japan places using controlled result cases and separate real-provider checks.
2. Ambiguous results remain a choice; selecting one establishes the corresponding marker and selected-place label through [selected-location spec](location-selection.md).
3. Results outside Japan cannot establish a selected location. Include island results and searching for a home from an overseas device.
4. Pending, no-result and failure states are distinguishable in both languages. Other location-selection methods stay usable after a search failure.
5. A slow response for an earlier query cannot overwrite later results or a newer selected point.
6. Query entry, ambiguity choice and result selection work with keyboard controls and readable focus on phones and computers in both themes.
7. Correcting the chosen point uses [selected-location spec](location-selection.md)'s map selection. An active hazard category remains chosen after the address changes.
8. Verify the selected provider's actual query capabilities, conditions and attribution before release; controlled responses alone do not prove them.

## Out of scope

Device-permission and Tokyo-fallback behavior, Japan-boundary sourcing and general selection persistence are owned by [selected-location spec](location-selection.md). Hazard categories, coverage and production hosting are separate. Saved places and shareable map state remain excluded.

## Dependencies and open decisions

Role: first-release feature requirements. Evaluate completion against this spec in the implementation being built.

This spec replaces [map-baseline spec](map-baseline.md)'s nonfunctional search field with a completed capability. It depends on [selected-location spec](location-selection.md)'s selected-location behavior and geographic validation. Provider choice remains an implementation prerequisite; it is not inherited from the original framework.

Depends on [selected-location spec](location-selection.md). Cross-feature acceptance integrates [hazard-exploration spec](hazard-exploration.md). Final deployed acceptance is owned by [release-acceptance spec](release-acceptance.md).
