# Map sidebar controls QA

Source visual: `/var/folders/rr/p608sjnx6_sbxkd7ckdv66rc0000gn/T/codex-clipboard-vvOwat.png`.
Source dimensions: 1022 × 765 pixels, including browser chrome.
Intended state: desktop sidebar open; mobile sidebar initially closed at 600px and below.

Implementation screenshot: unavailable. Both the in-app browser and Chrome returned `Browser is not available`.
Viewport, CSS size, density normalization, full-view comparison, and focused comparisons: blocked without browser capture.

## Checks

- Build and all 15 automated tests passed.
- Lint passed. Sidebar tests exercise both initial viewport states, both toggle buttons, breakpoint changes, Escape, focus return, and accessibility attributes.
- Search is input layout only, per the user's explicit selection.
- Typography, spacing, colors, asset fidelity, and rendered English/Japanese copy still require browser comparison.
- Browser interactions and console errors could not be checked.

## Findings

Visual QA is blocked by unavailable browser automation. No visual pass is claimed.

## Implementation checklist

- Capture desktop open/closed states and mobile open/closed states.
- Compare the annotated source against the desktop render; check toolbar spacing, sidebar edge control, existing tokens, icons, and copy.
- Verify map resizing, keyboard interaction, Japanese copy, narrow viewport overflow, and browser console errors.

Comparison history: no rendered comparison was possible.

final result: blocked
