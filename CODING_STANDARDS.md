# Coding standards

## Tests

- Add or update automated tests for new or changed behavior. Bug fixes must
  include a regression test that fails with the bug and passes with the fix.
  Documentation-only and formatting-only changes need no tests.
- Choose the fastest test that can reliably verify the behavior. Use the
  Vitest Node environment for logic and integration checks, and Vitest with
  React Testing Library and jsdom for component interactions. Standardize
  unit and component tests on Vitest. Cover relevant edge
  cases at these levels whenever possible.
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
