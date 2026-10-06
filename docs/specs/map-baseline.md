# Map baseline

## Problem statement

Current residents need an accessible map to orient themselves around a location, with readable controls in English or Japanese on phones and computers.

## Solution

Provide a bilingual interactive basemap with location centering, a collapsible sidebar and display preferences. This spec defines capabilities already present in the existing project as a product baseline that can be rebuilt independently in any framework.

## User stories

1. As a current resident, I want the Gensai entry point to take me to the Gensai map, so that I can open the map directly.
2. As a Japanese-speaking current resident, I want the Japanese entry point to retain its language when redirecting, so that I can read the map controls.
3. As a visitor, I want redirects to preserve my path, query string, and fragment, so that navigation does not discard URL details.
4. As a visitor, I want the map host to stay on the map host, so that opening it does not cause a redirect loop.
5. As an English-speaking current resident, I want an English map route, so that I can understand the application controls.
6. As a Japanese-speaking current resident, I want a Japanese map route, so that I can understand the application controls.
7. As a visitor, I want to choose English or Japanese in a language menu, so that I can switch the application language.
8. As a visitor, I want language switching to preserve the host and URL details, so that I remain on the equivalent map route.
9. As a visitor, I want the route to determine the page language, so that a saved preference cannot silently override a link's language.
10. As a visitor, I want the application shell to use my system theme initially, so that its controls suit my display preference.
11. As a visitor, I want to switch between light and dark themes, so that I can choose a readable application shell.
12. As a returning visitor, I want my saved theme to apply before the page paints, so that the application avoids a flash of the other theme.
13. As a visitor whose browser blocks storage, I want theme controls to continue working for the page, so that storage restrictions do not prevent changing the display.
14. As a visitor, I want labeled theme and language controls with tooltips, so that I can identify their actions.
15. As a visitor, I want an interactive demo basemap, so that I can explore map navigation while hazard layers remain unimplemented.
16. As a visitor who allows device location access, I want the prototype to attempt to center around my current location, so that I can orient myself on the demo map.
17. As a visitor without available device location, I want the demo map to remain usable around Tokyo, so that I can still explore the prototype.
18. As a visitor, I want a centering button that uses the last successful device location or Tokyo fallback, so that I can return to the prototype's initial area.
19. As a visitor, I want map navigation controls and a scale, so that I can navigate and judge distances.
20. As a visitor on a computer, I want the sidebar initially open, so that I can read the map explanation and access the centering button.
21. As a visitor on a phone, I want the sidebar initially closed, so that more of the map is visible.
22. As a visitor, I want both the floating grip control and the sidebar edge arrow to toggle the sidebar, so that I can open or close it from either control.
23. As a keyboard user, I want closed sidebar contents removed from interaction, so that focus does not enter hidden controls.
24. As a keyboard user, I want Escape inside the sidebar to close it and return focus to the grip control, so that I can resume navigation.
25. As an assistive technology user, I want sidebar controls to announce their action and expanded state in the route's language, so that I can understand their state.
26. As a visitor resizing the window, I want the sidebar to follow the phone or desktop default when crossing the breakpoint and the map to resize, so that the map fits the available space.
27. As a visitor, I want to read that uncoloured areas do not necessarily mean safety, so that I do not interpret absent colour as a safety verdict.

## Product decisions

These are product and interaction decisions. No framework, language, map library, component library, rendering strategy, hosting architecture or test runner is mandated.

- Provide one map experience in English and Japanese. English uses the map host's root; Japanese uses /ja. The route determines the application language.
- The Gensai entry point is https://gensai.help/ and the Gensai map is https://map.gensai.help/. Entry-point navigation reaches the equivalent map URL, preserving path, query and fragment without loops. Production uses HTTPS. Local development must support equivalent host behavior without requiring a particular server or port.
- The main viewing area is an interactive basemap with panning, zooming, navigation controls and a distance scale. It displays geography, not official hazards or live conditions, and needs an internet connection for map content.
- The baseline attempts device location access when the map opens. A successful position becomes the centering reference; otherwise use Tokyo. It does not restrict device coordinates to Japan or explain fallback. Spec [selected-location spec](location-selection.md) replaces this historical behavior for the first release.
- A localized "Center on me" action returns to the acquired device position or Tokyo without acquiring a fresh position. It does not select an independent home or other place.
- Use a full-height map with a collapsible sidebar. On computers it starts open beside the map. On phones it starts closed and overlays part of the map when opened. Exact dimensions and responsive breakpoints are implementation choices.
- Keep a floating grip toggle and search field at the upper left, theme and language controls at the upper right, and a second toggle at the sidebar edge. Both toggles remain available when closed; the edge toggle indicates its action. Map navigation is near the lower right and the scale near the lower left.
- The baseline search field has a localized label and placeholder but performs no search. It is a visual placeholder, not a completed capability. Functional search belongs to [address-search spec](address-search.md).
- The sidebar contains the centering action and a warning that uncoloured areas do not necessarily mean safety. It has no hazard categories, legends or selected-place summary.
- Sidebar changes leave a usable map fitted to the available area. Crossing between phone and computer layouts applies the corresponding default. Sidebar state is not retained after reopening the page.
- Sidebar controls have localized accessible names and expose open/closed state. Closed contents cannot receive focus or input. Escape inside closes the sidebar and returns focus to the floating toggle. Responsive changes must not leave focus in hidden content.
- Language selection retains the map host and equivalent route, including query and fragment. There is no separately saved language preference. Preserved URL details do not represent saved map state.
- Offer light and dark application themes. Use the system preference initially; a valid saved explicit choice takes precedence before visible content appears. Ignore invalid saved values and allow switching even when saving is unavailable.
- Theme and language controls have accessible action labels and tooltips. Application panels, menus and text follow the theme; changing the basemap style is not required.
- No account, welcome screen, preparation page or help page belongs to this baseline.

## Acceptance criteria

Use visible map behavior and public URLs as the acceptance boundary. Any testing tools may be used. These criteria guide a rebuild and do not certify that every scenario was verified in the baseline implementation.

1. Direct English/Japanese routes present the appropriate application language. Entry-point navigation preserves URL details and avoids redirect loops.
2. Language switching preserves the map host, equivalent route, query and fragment, and presents one application language at a time.
3. The system theme applies initially; a valid saved choice takes precedence before visible content appears. Invalid or unavailable saving does not prevent display or theme switching.
4. The map can be panned and zoomed, controls and scale are usable, and sidebar resizing leaves it fitted to the available area.
5. For the baseline, device-location success establishes the centering reference; failure leaves Tokyo. Centering returns to that reference without fresh acquisition. A complete first-release rebuild uses [selected-location spec](location-selection.md)'s replacement location criteria.
6. Sidebar defaults differ between computer and phone layouts. Both toggles and the edge indicator agree with its state. Responsive changes apply the appropriate default.
7. Hidden sidebar contents cannot receive focus. Escape returns focus to the floating toggle. Accessible action names and expanded state agree with the visible panel in both languages.
8. Theme/language labels and tooltips are readable. Map and controls remain usable on phones and computers in both themes.
9. The sidebar presents the baseline safety warning; search is documented as a placeholder, not a working capability.

## Out of scope

Remaining capabilities are specified separately: [selected-location spec](location-selection.md), [address-search spec](address-search.md), [hazard-exploration spec](hazard-exploration.md), and [release-acceptance spec](release-acceptance.md).

Accounts, guides, live alerts, offline maps, saved places and shareable map state are outside this baseline. Internal modules, storage APIs, bundled assets and deployment machinery are not prescribed.

## Dependencies and open decisions

Role: baseline product capabilities. This document defines what to recreate when building the baseline; it does not certify delivery in a new implementation.

Use this spec to recreate the baseline in any framework. Combine it with the
[visual reference](../design/visual-reference.md) for the existing appearance and
[selected-location](location-selection.md), [address-search](address-search.md),
[hazard-exploration](hazard-exploration.md) and [release-acceptance](release-acceptance.md)
specs for the full first release. Each takes precedence where it changes baseline
behavior. A release rebuild need not reproduce intermediate automatic location
requests or the nonfunctional search field.

Loading-message timing, transient-marker behavior, inaccurate fallback labels and potential mobile overlap are defects or verification gaps, not requirements to reproduce. Exact animations, zoom numbers, pixel breakpoints, icons and basemap vendors are not mandated.
