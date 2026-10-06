# Map controls acceptance

Spec: [#13](https://github.com/goncalvesjoao/gensai/issues/13). Integration ticket: [#33](https://github.com/goncalvesjoao/gensai/issues/33).

## Repeatable checks

Build with `npm run build`, then start `npm run preview -- --host 127.0.0.1 --port 4321`. The production preview includes the map-host/entry-point routing middleware. Set `TEST_URL` to its printed local address.

Run `node --test --test-concurrency=1 tests/browser/*.test.mjs` with `PLAYWRIGHT_MODULE`, `PNG_MODULE` and `CHROMIUM_PATH` pointing to installed Playwright, pngjs and Chromium when those packages are outside this checkout. Run `npm test`, `npm run lint`, `npm run format:check` and `git diff --check` as repository checks.

`hazard-exploration.test.mjs` exercises both launch languages, both themes and phone/computer widths with controlled Photon, device-location and tile responses. It captures `/tmp/gensai-controls-initial-{en,ja}-{phone,computer}-{light,dark}.png` and the equivalent `gensai-controls-open` matrix. Public controls cover repeated opening, independent hazards, coordinate correction, address/device selection, keyboard panning, horizontal zoom, preferences, resizing and close/reopen state retention. The separate palette check verifies all eight hazard combinations against fixed official colours.

`hazard-menu.test.mjs` checks inert/hidden contents, expanded state, keyboard focus, Escape from the map, preference-menu Escape ownership and explicit dismissal/focus return. Its four-result search regression checks exposed close/hazard controls, scale and attribution in both languages at 390 × 844 and 360 × 640. Choices scroll within the feedback panel instead of covering the hazard menu. The close button sits outside the scrollable hazard contents and remains available on short screens.

Existing address/device/selected-location checks retain their feature contracts. Their historical grip-toggle, automatically open desktop menu, breakpoint reset and full-height sidebar-padding expectations have been replaced with explicit opening/closing and preserved menu state. Welcome round-trip checks live in `welcome.test.mjs`.

## Visual inspection

Compare the initial and interactions boards in `docs/mockups.excalidraw` with the screenshot matrix for relative placement. The home/search group is upper left, display preferences upper right, layers lower left and horizontal minus/plus lower right. Phone spacing moves the search group below preferences. The hazard menu is initially closed, opens above its layers control and retains usable map area.

The integration fix removes a repeated safety paragraph from the hazard controls because the permanent legend already supplies the explicit coverage warning. Compact switches and bounded scrollable panels keep the warning, scale, attribution and map controls exposed. Coordinate help is inside its existing disclosure; the selected-location status and correction summary remain available outside the hazard menu.

Controlled neutral tiles establish repeatable layout and interaction evidence, not live official-data coverage. Live source verification remains in the hazard-source ADR and hazard-exploration work. These local checks do not replace deployed first-release acceptance in #29.

## Results on 2026-10-06

Production-preview browser suite: 56 tests, 54 passed, 2 explicitly skipped live-network checks, zero failures. The final close-header refinement also passed all 8 menu and four-result occlusion checks. `npm test` passed all 15 baseline checks; build, lint, scoped formatting and `git diff --check` passed. Repository-wide formatting reported the pre-existing `.agents/skills/implement-spec-loop/SKILL.md` formatting issue outside this feature scope.

The initial/open matrix covers all 8 locale/theme/width combinations. Representative live-geography captures are `/tmp/gensai-controls-live-ja-phone-{closed,open}.png`. Search-feedback captures at both phone heights are `/tmp/gensai-controls-feedback-ja-phone-{640,844}.png`. These images were inspected for readable labels, retained geography, exposed close/hazard controls and clear scale, attribution and coverage warning. The short-phone inspection caught a close-button overlap during scrolling; keeping the header outside the scroll contents resolved it.

The browser suite used `TEST_URL=http://127.0.0.1:4334` and `HOME_TEST_URL=http://localhost:4334` against the same production preview. The two skipped checks are deliberately opt-in live Photon and official-raster probes; controlled search, device, hazard-colour and failure-path checks ran normally.
