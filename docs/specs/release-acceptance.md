# Production access and first-release acceptance

## Problem statement

Current residents need to reach a deployed, usable Gensai map and complete the full bilingual workflow. A working local page or individually completed features alone does not establish production access or release readiness.

## Solution

Provide a welcoming work-in-progress home page at the Gensai entry point, an explicit call to action to open the map, reliable production URLs and verify the integrated first-release workflow across device-location selection, address search and official hazard exploration.

## User stories

1. As an English- or Japanese-speaking current resident, I want controls, legends, location explanations and coverage warnings in my chosen language, so that I can complete the workflow.
2. As a keyboard user, I want to search, choose results, select a category and use floating map controls and the hazard menu, so that the workflow is accessible without a pointer.
3. As a current resident on a phone, I want usable controls and enough map visible to inspect surroundings, so that the workflow works on a narrow screen.
4. As a visitor, I want the Gensai entry point to show a welcoming home page that says the project is a work in progress, so that I understand its current status.
5. As a visitor without client-side scripting, I want to read the welcome and follow the map call to action, so that basic navigation does not depend on page scripts.
6. As a visitor, I want direct English and Japanese map URLs to work over HTTPS, so that I can open or revisit either language route.
7. As an English- or Japanese-speaking visitor, I want the home page's map call to action to open the map in my chosen language, so that I can continue in that language.
8. As a current resident, I want the available map functions to remain understandable when a network request fails, so that I can distinguish a failure from absent hazard mapping.
9. As a visitor, I want to remain on the home page until I choose to open the map, so that I can read the welcome without an automatic redirect.
10. As a current resident viewing the map, I want the home button to return to the welcome page, so that I can revisit the project introduction.
11. As a keyboard user, I want a clearly labeled and focusable map call to action, so that I can open the map without a pointer.

## Product decisions

This is a framework-independent product spec. No existing code, library, rendering architecture or testing tool is required.

- Provide https://gensai.help/ as the Gensai entry point and home page, and https://map.gensai.help/ as the map. English uses the root on each host; Japanese uses /ja on each host. The home page stays on the entry-point host and does not automatically redirect to the map.
- Present a welcoming message that explicitly says Gensai is a work-in-progress project, plus a prominent localized "Open map" call to action. The call to action is a normal link to the map root or /ja according to the home page's language. Do not require an account, geolocation permission or an intermediate step.
- The map's home button returns to the entry-point home page in the active language. The welcome page remains visible until the visitor activates the map link. Remove automatic entry-point-to-map redirects at all layers, including hosting, HTTP, page metadata and browser scripts. This supersedes the baseline's entry-point redirect requirement; the map's existing language-switch URL behavior remains unchanged.
- Serve both production hosts over HTTPS and support direct English/Japanese home and map routes. The welcome text and map link must be available without client-side scripting. This does not require an interactive map without scripting. Keep the home page and its call to action readable and keyboard-accessible on phones and computers in both languages and application themes.
- Any hosting/rendering architecture satisfying those outcomes is acceptable. Choose hosting and verify host configuration during implementation rather than inheriting the original framework or static-build arrangement.
- Carry forward [map-baseline spec](map-baseline.md)'s unchanged host addresses, language and theme capabilities. Replace its automatic entry-point redirect with the welcome page and explicit map link above. Apply [map-controls spec](map-controls.md)'s floating layout, initially closed hazard menu and explicit dismissal in place of the old sidebar requirements. Apply [selected-location spec](location-selection.md)'s changed startup/selection behavior and the separate search and hazard requirements.
- Feature-owned localization, keyboard behavior, responsive layout and failures remain in their respective specs. This spec verifies those features work together; it does not duplicate their implementation ownership.
- Require an internet connection, with explained map/search/hazard failures as specified by each feature. Do not advertise offline functionality.
- Declare the first release ready only after each feature's acceptance criteria and the integrated checks here pass. Retain explicit outstanding source checks or product decisions rather than marking them completed.

## Acceptance criteria

Use the complete visible feature and its public behavior as the acceptance boundary. Any suitable tools may be used; controlled device/provider responses allow repeatable checks without prescribing internal interfaces.

1. Verify deployed DNS and HTTPS for both hosts. Opening either language route on the entry-point host displays localized welcome text, an explicit work-in-progress statement and a prominent map link, and stays on that page without redirecting. Repeat with scripting enabled and disabled. Activating the link opens the corresponding map root or /ja; no location request is made by the home page.
2. Direct map root and /ja URLs load. Switching languages stays on the map host, and themes continue to satisfy [map-baseline spec](map-baseline.md). Floating controls and hazard-menu behavior satisfy [map-controls spec](map-controls.md), including returning to the language-equivalent welcome page and using its call to action to reopen the map. The home page remains visible until that action.
3. Opening the map starts at a Japan overview with no location request. Explicit inside-Japan acquisition works; denial, timeout, unavailable acquisition and outside-Japan location produce explained Tokyo fallback.
4. Submit Japanese-script and Latin-character addresses with Enter, handle single and ambiguous matches, correct a point, and inspect the selected place using the independent hazard switches. Preserve enabled categories after location changes and menu dismissal. Verify menu persistence during search, location selection and map navigation, with matching legends, attribution and warnings visible when it is closed.
5. Complete the flow in English/Japanese on phone/computer viewports and both themes with keyboard controls, readable focus and usable panel/map layering.
6. Exercise map, search and hazard failure cases and unknown coverage in the integrated experience. Verify failures never imply safety, no mapped hazard or verified unavailable coverage.
7. Verify selection persists for the open-page workflow and is not restored after closing, including the recorded language-switch decision.
8. Require the selected-location, search and hazard specs' feature checks and real-source verification to pass. Controlled local checks do not establish deployed availability or official-data accuracy.

## Out of scope

Implementing device-location, address-search or hazard behavior owned by the separate specs; choosing a particular framework/hosting vendor; interactive map support without scripting; guides, alerts, accounts, offline maps, saved places or shareable map state.

## Dependencies and open decisions

Role: first-release feature requirements. Evaluate completion against this spec in the implementation being built.

Final acceptance depends on the [selected-location](location-selection.md),
[address-search](address-search.md) and [hazard-exploration](hazard-exploration.md)
specs and the [map-controls spec](map-controls.md), together with the unchanged capabilities of the [map baseline](map-baseline.md). Production
routing can be delivered earlier; complete release acceptance requires both
verified production access and the integrated workflow.

The owner confirmed on 2026-10-06 that the Gensai entry point must show a work-in-progress welcome and a map call to action instead of automatically redirecting. This replaces the historical redirect requirements without changing the map host or launch languages.
