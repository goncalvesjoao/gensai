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

## Hosted workflow validation correction

The first hosted push run at published head
`e4d0a8a2c96b684121d357e5a65551ab927ef743` failed before jobs were created:
[run 37947114260](https://github.com/goncalvesjoao/gensai/actions/runs/37947114260).
There are no job logs or acceptance results for that run.

`actionlint-red.log` is copied verbatim from the one-off command
`actionlint .github/workflows/verification.yml` against that workflow (also unchanged
at report-only revision `5fb5ceefb7525a09160728cb2206cf564b0cf625`). It detects
both invalid job-level `runner.temp` references. actionlint 1.7.12 was downloaded
from its [official release](https://github.com/rhysd/actionlint/releases/tag/v1.7.12),
reports Go 1.26.1/linux/amd64, and is temporary validation tooling rather than a new
repository dependency or mandatory gate. GitHub's
[context availability reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability)
confirms `runner` is unavailable in `jobs.<job_id>.env`.

The same validator exits 0 with no diagnostics after artifact paths are exported
from `RUNNER_TEMP` through `GITHUB_ENV` in each job's first step. Artifacts remain
outside the source checkout, with the same commands and 14-day retention. This
correction changes no application, verification runner or browser tests, so the
previous full browser evidence remains applicable to their identical source.
