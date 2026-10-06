# Production access and first-release acceptance

## Problem statement

Current residents need to reach a deployed, usable Gensai map and complete the full bilingual workflow. A working local page or individually completed features alone does not establish production access or release readiness.

## Solution

Provide reliable production entry-point and map URLs and verify the integrated first-release workflow across device-location selection, address search and official hazard exploration.

## User stories

1. As an English- or Japanese-speaking current resident, I want controls, legends, location explanations and coverage warnings in my chosen language, so that I can complete the workflow.
2. As a keyboard user, I want to search, choose results, select a category and use sidebar controls, so that the workflow is accessible without a pointer.
3. As a current resident on a phone, I want usable controls and enough map visible to inspect surroundings, so that the workflow works on a narrow screen.
4. As a current resident, I want the deployed Gensai entry point to redirect to the map and the map's English and Japanese URLs to load directly, so that I can reach the release reliably.
5. As a visitor without client-side scripting, I want the entry point to redirect to the map host, so that reaching the correct URL does not depend on page scripts.
6. As a visitor, I want direct English and Japanese map URLs to work over HTTPS, so that I can open or revisit either language route.
7. As a visitor following a URL, I want the redirect to preserve its language, path, query and fragment without loops, so that navigation does not discard its details.
8. As a current resident, I want the available map functions to remain understandable when a network request fails, so that I can distinguish a failure from absent hazard mapping.

## Product decisions

This is a framework-independent product spec. No existing code, library, rendering architecture or testing tool is required.

- Provide https://gensai.help/ as the Gensai entry point and https://map.gensai.help/ as the map. English uses the map root; Japanese uses /ja. Entry-point navigation reaches the equivalent map URL, preserving language, path, query and fragment without loops.
- Serve both production hosts over HTTPS and support opening English/Japanese map routes directly. Entry-point redirects must work without client-side scripting. This requires access to the correct URL without scripting, not an interactive map without scripting.
- Any hosting/rendering architecture satisfying those outcomes is acceptable. Choose hosting and verify host configuration during implementation rather than inheriting the original framework or static-build arrangement.
- Carry forward [map-baseline spec](map-baseline.md)'s unchanged URL, language, theme and sidebar capabilities. Apply [selected-location spec](location-selection.md)'s changed startup/selection behavior and the separate search and hazard requirements.
- Feature-owned localization, keyboard behavior, responsive layout and failures remain in their respective specs. This spec verifies those features work together; it does not duplicate their implementation ownership.
- Require an internet connection, with explained map/search/hazard failures as specified by each feature. Do not advertise offline functionality.
- Declare the first release ready only after each feature's acceptance criteria and the integrated checks here pass. Retain explicit outstanding source checks or product decisions rather than marking them completed.

## Acceptance criteria

Use the complete visible feature and its public behavior as the acceptance boundary. Any suitable tools may be used; controlled device/provider responses allow repeatable checks without prescribing internal interfaces.

1. Verify deployed DNS and HTTPS for both hosts. Opening the entry point reaches the equivalent map URL, including Japanese paths and URL details, without loops. Test entry-point navigation with scripting disabled.
2. Direct map root and /ja URLs load. Switching languages stays on the map host, and themes/sidebar behavior continue to satisfy [map-baseline spec](map-baseline.md).
3. Opening the map starts at a Japan overview with no location request. Explicit inside-Japan acquisition works; denial, timeout, unavailable acquisition and outside-Japan location produce explained Tokyo fallback.
4. Search in Japanese script and Latin characters, choose ambiguous results, correct a point, and inspect the selected place using each hazard category. Preserve category after location changes.
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
specs, together with the unchanged [map baseline](map-baseline.md). Production
routing can be delivered earlier; complete release acceptance requires both
verified production access and the integrated workflow.
