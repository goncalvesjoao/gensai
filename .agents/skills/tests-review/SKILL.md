---
name: tests-review
description: Audit the existing test suite against CODING_STANDARDS.md when the user asks which tests need updating, refactoring, moving, or removing. Produces a report without changing tests.
---

# Tests review

Review the requested tests, or the whole suite when no scope is supplied.
Report recommendations; implement them only when the user requests changes.

## Gather evidence

Read repository instructions and the current `CODING_STANDARDS.md` before
reviewing. Treat that file as the authority rather than copying its rules here.
If it is absent, report that the standards review cannot be completed.

Inspect test commands, runner configuration, shared fixtures, and setup to
identify the suites actually executed, their environments, and build or network
dependencies. Read each test in scope alongside the production behavior it
exercises. Read domain docs as directed by repository instructions. Fetch issues
only when needed to resolve a requirement, following the issue-tracker workflow.

Map each test's assertions to a current requirement or concrete failure risk.
Compare coverage across suites by the behavior verified, not by test names.
Account for parameterized cases and assertions within mixed-purpose tests.
Finish only when every test in scope has been assessed, or explicitly list what
remains unreviewed.

## Evaluate changes

Apply every relevant testing rule in `CODING_STANDARDS.md`. For each proposed
update, move, merge, or removal, identify the existing assertions and the smallest
change that preserves meaningful coverage.

Before calling a test redundant, identify the replacement test and verify that
it detects the same failure. Distinguish source logic, built output, and deployed
behavior. Similar assertions at those levels may protect different failures.
A past bug explains a test's origin; assess whether its requirement still applies.
If the requirement is unclear, report the uncertainty instead of recommending
removal as settled.

For browser tests, separate logic assertions from checks that need actual layout,
focus navigation, rendering, or application integration. Recommend a cheaper
environment only when it can detect the same failure without mocking away the
behavior under test. Preserve the browser portion of mixed tests where needed.

Check whether assertions would detect the claimed failure, whether mocks bypass
it, and whether a proposed refactor would lose edge cases, error handling, or
accessibility coverage. Passing tests alone do not establish adequate coverage.

Run focused local checks when they resolve an uncertainty. Measure runtime when
making a performance claim; otherwise label savings as unmeasured. Keep live
provider and deployed-host checks separate from local evidence.

## Report

Lead with the highest-value changes, ordered by impact. For each finding include:

- Test file and line, and the applicable standard.
- The current requirement or failure risk and why coverage needs to change.
- The smallest proposed change, its target environment, and coverage retained.
- The replacement test for a removal, or the coverage to add before removal.

Distinguish standards violations from optional improvements. List browser tests
that should remain and their concrete browser-specific reasons. End with the
reviewed scope, tests executed, unresolved requirements, and any unreviewed files.
Report no findings when the evidence supports keeping the suite as it is.
