# Selected location and device-location fallback

## Problem statement

Current residents need to choose a home, workplace or another location in Japan without confusing that selected location with the device's current location. Device access may be denied, unavailable or outside Japan.

## Solution

Provide a Japan overview, explicit device-location acquisition and map-point selection, with a readable selected-place marker and an explained Tokyo fallback. This spec replaces the baseline's automatic location request and silent fallback.

## User stories

1. As a current resident, I want an overview of Japan when the map opens, so that I can choose a place without granting location access.
2. As a current resident, I want location permission requested only after I choose "Use my location", so that I control access to my device's position.
3. As a current resident, I want a successful device position inside Japan to select that location, so that I can inspect nearby mapped hazards.
4. As a current resident who denies location access, I want the map to fall back to Tokyo with an explanation, so that I understand what happened.
5. As a current resident whose device cannot provide a position or times out, I want a Tokyo fallback with an explanation, so that I can continue using the map.
6. As a current resident whose device is outside Japan, I want a Tokyo fallback with an explanation, so that the map remains focused on Japan.
7. As a current resident, I want fallback text to distinguish Tokyo from my current location, so that I do not mistake it for a detected position.
8. As a current resident, I want to select or correct a point on the map, so that I can inspect places without a useful address result.
9. As a current resident checking from another place, I want the selected location to remain distinct from my current location, so that I can inspect my home from work or overseas.
10. As a current resident, I want location selection to support Japan's islands, so that a mainland-only restriction does not exclude my home.
11. As a current resident, I want navigation focused on Japan while nearby geography can remain visible, so that the supported area is clear.
12. As a current resident, I want a marker and readable selected-place label, so that I know which place I am examining.
13. As a current resident, I want my selected location retained while the page remains open, so that unrelated interactions do not discard it.
14. As a current resident, I want the selected location forgotten after the page closes, so that it is not retained as a saved place.
15. As an English- or Japanese-speaking current resident, I want location controls and explanations in my chosen language, so that I can understand the result of my action.
16. As a keyboard user, I want accessible location controls and a supported way to correct the selected place, so that I can complete location selection without relying only on a pointer.
17. As a current resident on a phone, I want location controls to leave enough map visible, so that I can inspect my selected place.
18. As a current resident, I want the device-location button beside the address field to work with the hazard menu closed, so that I can select my current location directly from the map.

## Product decisions

This is a framework-independent product spec. No existing code, library, rendering architecture or testing tool is required.

- Start with an overview of Japan without requesting device location. Request it only after the person activates the device-location button at the right end of the search group, with the localized accessible action "Use my location". It remains available with the hazard menu closed and does not submit address search. This replaces the historical sidebar centering button and requests acquisition rather than merely returning to a cached position.
- A successful device position inside Japan becomes the selected location. Current location and selected location are distinct; a home can be examined from work or overseas.
- On denial, unavailable geolocation, timeout or an outside-Japan device position, center on Tokyo and show a localized explanation of the cause. Never identify fallback as detected current location. Keep map-point selection and, when available, address search usable.
- Let the person select and correct a point on the map. Validate all selections against a verified Japan boundary that includes its islands. This same geographic rule applies to device positions and address results.
- Keep navigation focused on Japan while allowing neighbouring geography near viewport edges.
- Show a marker and readable selected-place label for an actual selected location. Keep one selected location while the page remains open, including after layout changes. Do not restore it after the page closes or encode saved map state in a shareable URL.
- Provide the selected-location behavior that address search and hazard exploration use. Those features can be delivered separately; this spec does not require a search provider or hazard dataset to prove device and map-point selection.
- Keep selection, marker and readable map stable through location updates, hazard-menu changes and resizing. Preserve the enabled hazard categories when that separate capability is available.
- Localize the controls and acquisition outcomes in English and Japanese, support keyboard access and visible focus, and keep the workflow usable on phone and computer layouts in both application themes.
- Choose verified boundary evidence during implementation. Suitable overview/selected-place scales, fallback-marker semantics, selected-place labels, language-switch retention and exact failure wording remain details to resolve. This split does not invent answers to them.

## Acceptance criteria

Use the complete visible feature and its public behavior as the acceptance boundary. Any suitable tools may be used; controlled device/provider responses allow repeatable checks without prescribing internal interfaces.

1. Opening shows a Japan overview and makes no location request. Only activation of the device-location button requests access. Verify it with the hazard menu closed and open, without submitting the address field.
2. Successful mainland and island positions in Japan become selected locations. Device positions outside Japan produce Tokyo fallback rather than an unsupported selection.
3. Denial, unavailability and timeout each produce Tokyo with the appropriate explanation. Visible and accessible labels never call fallback the person's current location.
4. Choosing and correcting a map point updates marker and selected-place label. Outside-Japan points cannot become valid selections. A person using an overseas device can still inspect a home in Japan.
5. Selection remains stable through layout changes and other in-page actions, is forgotten after closing, and follows the recorded language-switch decision.
6. Location updates retain the enabled hazard categories when integrated with hazard exploration. An address chosen through the search spec uses the same selection and boundary rules.
7. Exercise localized controls, keyboard access, focus and phone/computer layouts in both themes. Check fallback-marker behavior against its recorded decision.

## Out of scope

Address-query handling and provider choice; official hazards, legends and coverage; production deployment; saved places, shareable map state and automatic startup location requests.

## Dependencies and open decisions

Role: first-release feature requirements. Evaluate completion against this spec in the implementation being built.

This spec is open and supersedes [map-baseline spec](map-baseline.md)'s startup and centering behavior for the first release. Address search adds another way to establish the same selected location; hazard exploration reads it. Implement this spec independently of those providers, then verify the integrations. The owner confirmed explicit permission and explained Tokyo fallback on 2026-10-06.

The [map-controls spec](map-controls.md) defines the floating device-location button and panel behavior from the mockups.

Related specs: [address-search spec](address-search.md) adds an address-selection method; [hazard-exploration spec](hazard-exploration.md) uses the selected location; [release-acceptance spec](release-acceptance.md) checks their integration. This feature needs neither a search provider nor a hazard provider for its own device/map-selection acceptance.
