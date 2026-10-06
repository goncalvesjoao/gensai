# Gensai map controls and persistent hazard menu

## Problem statement

Current residents need to navigate the Gensai map, choose a selected location and reach hazard controls while keeping the map visible. The historical open desktop sidebar and its two toggles do not match the mockups' floating controls and initially closed hazard menu.

## Solution

Provide the map layout shown in the initial-state and interactions mockups: home and search controls at the upper left, display preferences at the upper right, a hazard-menu button at the lower left and zoom controls at the lower right. Open the hazard menu only on request and keep it open until the person explicitly closes it.

## User stories

1. As a current resident, I want the map to occupy the main viewing area, so that I can inspect surroundings without an initially open panel.
2. As a current resident, I want a home button at the upper left, so that I can navigate to the Gensai entry point.
3. As a Japanese-speaking current resident, I want home navigation to retain my language, so that I reach the equivalent Japanese route.
4. As a current resident, I want address search beside the home button, so that I can find a selected location directly from the map.
5. As a current resident, I want a device-location button at the right end of the search control, so that I can request my current location without opening a panel.
6. As a current resident, I want theme and language controls grouped at the upper right, so that I can find display preferences together.
7. As a current resident, I want a sun icon in the light theme and a moon icon in the dark theme, so that I can recognize the current display state.
8. As a current resident, I want a language dropdown containing English and 日本語, so that I can choose a launch language.
9. As a current resident, I want a layers icon at the lower left to open the hazard menu, so that I can find the hazard controls.
10. As a current resident, I want the hazard menu closed when the map opens, so that the initial map remains visible on computers and phones.
11. As a current resident, I want the open hazard menu to stay visible while I change hazards or navigate the map, so that I can continue adjusting it.
12. As a current resident, I want a close button at the menu's upper right, so that I can dismiss it deliberately.
13. As a current resident, I want opening and closing the menu to preserve my selected location and hazard choices, so that I do not lose my work.
14. As a current resident, I want minus and plus controls grouped at the lower right, so that I can zoom out and in.
15. As a keyboard user, I want labeled controls and visible focus, so that I can operate the map controls without a pointer.
16. As a keyboard user, I want Escape to close the hazard menu and return focus to its opener, so that I can dismiss it without finding the close button.
17. As an assistive technology user, I want the menu button to announce whether the menu is open, so that I can understand its state.
18. As a keyboard user, I want closed menu contents excluded from focus, so that I do not encounter invisible controls.
19. As a current resident resizing the window, I want the open menu to remain open, so that responsive changes do not discard my explicit choice.
20. As a current resident on a phone, I want usable controls and enough visible map, so that I can complete the same workflow on a narrow screen.
21. As a current resident, I want legends, attribution and the coverage warning available when the hazard menu is closed, so that I can still interpret visible hazard layers.

## Implementation decisions

These are framework-independent product and interaction requirements. Reuse the baseline's URL, language, theme, panning and scale capabilities where they remain compatible.

- Use the mockups' relative layout. At the upper left, place a separate home button followed by a search group with a search icon, address field and independently operable device-location button. Group theme then language at the upper right. Place the layers-menu opener at the lower left and horizontal minus then plus zoom controls at the lower right.
- Begin with the hazard menu closed on both computer and phone layouts. Replace the historical grip toggle, sidebar-edge arrow and automatically open desktop sidebar with the layers opener and an explicit menu close button. Do not reproduce the old sidebar's responsive reset behavior.
- Opening the menu presents a panel associated with the lower-left layers control, with a close button at its upper right and the hazard controls owned by the hazard-exploration spec. The detached panel in the interactions board illustrates its contents, not an exact on-screen position. Keep enough map visible and do not obscure controls, scale or attribution with panel content.
- Keep the menu open during map clicks, panning, zooming, location changes, hazard changes, outside clicks, preference interaction and responsive resizing within the same page. The opener opens rather than toggles an already open menu closed. Close through the close button or Escape. A new page starts closed; persistence across reloads or route navigation is not required.
- Opening and closing the menu changes visibility only. It does not clear the selected location or enabled hazard categories. Expose expanded state and the controlled panel relationship. Closed contents cannot receive focus or pointer input. Explicit dismissal returns focus to the opener. Resizing must not strand focus in hidden content.
- Keep map navigation usable while the panel is open. The panel does not require a modal backdrop or a focus trap. Preserve the baseline's scale and readable official attribution even though the wireframe omits them.
- Address submission is owned by the address-search spec; device acquisition and Tokyo fallback are owned by the selected-location spec. These actions remain available while the hazard menu is closed.
- The theme control toggles light/dark and reflects the current theme with sun/moon respectively. Preserve system-theme initialization, saved explicit choices, pre-paint application and operation without browser storage. The wireframe's light appearance does not override those requirements.
- The language dropdown lists English and 日本語. Preserve the existing route contract: English at the map root, Japanese at /ja, with equivalent paths, query and fragment preserved on the map host. The annotation about a locale prefix does not establish a new /en route or more launch languages.
- The home button navigates to the Gensai entry point in the active language. Under the existing release routing, that entry point redirects back to the equivalent map route. The mockups do not specify a separate home page's content or a change to that redirect. A distinct landing page requires its own spec and a revision of production routing.
- Give every icon control a localized accessible action name and visible keyboard focus. Treat decorative icons as decorative. Separate the location button from address submission so activating it does not submit the query.
- Adapt spacing and control sizing for narrow screens without overlap or loss of functionality. Exact pixel dimensions, breakpoints, animations and colors are implementation choices. The pink rectangle is a map placeholder; it is not a basemap palette or hazard area.

## Testing decisions

Use the visible Gensai map and public URLs as the single acceptance boundary, with controlled location/search/hazard responses for repeatable outcomes. Test external behavior, not component structure or a particular state implementation. Compare screenshots with the mockups for relative positions, menu state and icons; do not use wireframe colors or exact pixels as acceptance criteria.

Prior art in the existing project covers sidebar expanded state, hidden-content interaction, Escape/focus return, responsive changes, localized routes, redirects and theme initialization. Reuse that behavioral coverage, revising the old sidebar defaults and breakpoint-reset expectations rather than retaining contradictory checks. Browser interaction and visual checks must cover the real rendered controls; isolated script checks alone cannot establish layout or accessibility.

1. On both launch routes and computer/phone layouts, the map opens with the hazard menu closed and all floating controls visible in their specified groups. There is no startup device-location request.
2. Opening shows hazard controls and a close button. Repeated opener activation, hazard selection, outside/map clicks, panning, zooming, search selection, device selection and resizing leave the menu open. Explicit close and Escape hide it and return focus to the opener.
3. Hidden controls cannot receive focus/input. Accessible names, expanded state, focus visibility and keyboard operation agree with the visible menu in both languages and themes.
4. Closing/reopening preserves the selected location, enabled categories and visible hazard data. Legends, warning and attribution remain readable with the menu closed.
5. Enter submits address search. The adjacent location button requests device acquisition only when activated and does not submit the address field. Feature-specific outcomes follow their respective specs.
6. Minus zooms out and plus zooms in. Both remain usable with the menu open; panning, scale and attribution remain usable on narrow screens.
7. Theme switching changes the shell and sun/moon icon consistently. Language selection follows the root-/ja contract and preserves URL details; home navigation reaches the language-equivalent entry point and follows its redirect without loops.
8. Capture initial/open-menu states in both languages and themes at computer and phone widths. Check control overlap, readable panel contents, focus and retained map area against the mockups' layout, including the longer Japanese labels.

## Out of scope

Implementing address providers, location acquisition or hazard datasets; a new home page or preparation content; more launch languages; persistent menu state across page navigation; replacing the specified production routes; exact wireframe colors or pixel-perfect reproduction.

## Further notes

The initial-state board establishes a closed hazard menu and the floating control groups. The interactions board explicitly describes Enter submission, device permission on button activation, theme switching, locale navigation, home navigation, zooming and keeping the hazard menu visible until close. Escape dismissal adds keyboard equivalence to the close button.

The independent hazard switches are interpreted in the hazard-exploration spec. Ellipsis in the menu does not add unnamed categories. Existing source, coverage, legend and safety requirements remain necessary even though the wireframe does not draw them.

This spec overrides the map baseline's sidebar layout, opener controls, desktop default and responsive reset. It does not redefine the historical baseline as unfinished. Final release acceptance includes this layout together with the selected-location, address-search and hazard-exploration specs.

The owner confirmed the proposed visible-map/public-URL testing boundary on 2026-10-06.
