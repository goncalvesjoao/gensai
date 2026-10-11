# Coding standards

## Tests

- New or changed behavior must have automated test coverage. Bug fixes must
  have regression coverage that detects the bug. Add or update tests when
  existing coverage is insufficient.
  Documentation-only and formatting-only changes need no tests.
- Each test must protect a current requirement or meaningful failure risk.
  For added or modified tests, reviewers must check whether existing coverage
  already protects that behavior and whether a cheaper test provides equivalent
  confidence. A past bug alone does not justify retaining a redundant test.
  Preserve unique coverage when removing tests.
- Choose the fastest test that can reliably verify the behavior. Use the
  Vitest Node environment for logic and integration checks, and Vitest with
  React Testing Library and jsdom for component interactions. Standardize
  unit and component tests on Vitest. Cover relevant edge cases at these levels
  whenever possible.
- Use Playwright only when verification requires a real browser, such as
  layout, browser-native behavior, MapLibre rendering, or a critical journey
  across the running application. Keep browser coverage focused on those
  risks; test logic and edge-case combinations without a browser.
- For each added or expanded browser test, explain in the test or change
  description what browser-specific risk it covers and why a Node or jsdom
  test would be insufficient. Mocking away the behavior under test does not
  count as equivalent coverage.
- Standards reviews must flag missing behavioral coverage and browser tests
  whose assertions can be reliably covered without a browser. Running the
  existing suite alone does not satisfy coverage for changed behavior.
