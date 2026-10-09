# Spec #48 verification evidence

Curated logs are copied verbatim from public commands; JSON metadata is formatted
without changing its values. Original transient paths
remain in metadata for diagnosis; durable filenames in this directory are the
review pointers. Source/build fingerprints and revision attribution are retained.

- `baseline-metadata.json` and `baseline-tests.tap`: passing full historical
  source cfa3b44470e4f204fb76ad803501b16c11bd5b74; setup metadata identifies
  separately installed locked tooling and excludes install time from the comparison.
- `implementation-metadata.json` and `implementation-tests.tap`: clean immutable
  full source cf33c08ac10463ecdaee79a10fd68f68dc1765ce, before this report-only archive.
- `lint`, `format` and `node` metadata/output: public wrapper checks at that source.
- `baseline-supervision` metadata/output: 3/3 historical welcome checks with the
  copied shared supervisor dependency; this focus is not full runtime evidence.
- `centering-red` output/metadata: first clean full attempt exposed Japanese phone
  centering, then was canceled. Source changed after cancellation while metadata
  finished; the record says changed true and is not completed evidence. Old summary
  counts were absent but incorrectly recorded as zero; the later parser fixes this.
- `theme-red` output/metadata: next immutable full attempt completed 57/1/2 with
  a theme keyboard hydration timeout. Neither failing run contributes to timing.
- `summary-red.tap`: public interruption assertion initially failed because absent
  totals were invented as zero. `lifecycle-green.tap` retains passing 4/4 after fix.
- `initial-runner-red`, `initial-fixture-red` and `initial-lint-red`: actual first
  red output retained by implementation workers. These predate structured runner
  attribution and lack exact dirty-source fingerprints; no missing attribution
  is invented. Fixture red was a missing module, not a provider-outage experiment.

Both measured full runs used the same machine, Node v26.8.2, Playwright 1.64.0,
managed Chrome for Testing 156.0.8078.4 (Chromium build 1248), and tooling lock SHA256
683e46bcda83db853c3ed8b11266f185846505f3b1ae2d776094c7259c7527e7. Both ran serially with no concurrent
browser suite, using separate clean checkouts/builds. Generic lifecycle/checks ran
briefly during the baseline; background load is not controlled statistically.
No machine-specific browser/module environment override was needed by implementation.

Both measured commands executed 60 local cases: 58 routine passes, two explicitly
skipped live probes, no failed/canceled cases. Both excluded deployed probes. The
historical tests retained incidental provider requests; implementation uses controlled
fixtures and rejects unexpected external requests. Rendering matrices, assertions,
route/language/viewport/storage/theme/location/hazard coverage remain inventoried in
`docs/testing-coverage.md`; fixture passes establish no provider or coverage result.

Single observed browser durations were 639.014s before and 595.188s after; wrappers
including build/previews were 644.351s and 599.272s. Installation is excluded. This
observation is not a statistical benchmark or a guaranteed performance improvement.
