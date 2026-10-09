# Verification

Use a Node version supported by `package.json` (Node 22.22.3, 24.16.0, or 26.3.0 and later). Install the locked dependencies with `npm ci`, then install the declared browser with `npx playwright install chromium`; Linux CI may use `npx playwright install --with-deps chromium`.

Run `npm run test:browser` for the complete browser suite. The routine excludes the deployed-host production probe file and records that exclusion. The command builds this checkout, starts two owned local previews, waits up to 15 seconds for readiness, runs the existing Node test framework, and stops preview process groups after success, failure, SIGINT, or SIGTERM. Entry-point and map-host navigation share the first preview port; `TEST_URL` addresses the second preview. No existing externally managed server is needed.

For a focused run, use `npm run test:browser -- tests/browser/welcome.test.mjs` or `npm run test:browser -- --test-name-pattern='welcome' tests/browser/welcome.test.mjs`. Use Node test flags in `--option=value` form. The runner preserves rendered-behavior and pre-paint tests; selection does not change their assertions. `GENSAI_PREVIEW_TIMEOUT_MS` changes the bounded startup deadline. Browser launch failures fail the run; install Chromium before verification.

## Evidence

Every run prints its artifact directory. By default, unique run directories are created beneath the operating system's temporary directory, outside tracked source. Set `GENSAI_TEST_ARTIFACTS=/path/to/artifacts` to choose a CI-uploadable root; repeated runs create separate `run-*` directories instead of overwriting logs. The browser suite also receives `TEST_ARTIFACT_DIR` for screenshots and diagnostics.

`runner.log` starts before validation, build, or test execution. `build.log`, `preview-home.log`, `preview-map.log`, and `tests.log` capture their processes from launch, including initial failing tests. `metadata.json` records the command, checkout, source revision, initial dirty state, source and build fingerprints, start/end times, duration, exit status, preview process IDs and addresses, skipped/canceled phases, and test summary where available. Use `npm run verify -- npm run lint`, `npm run verify -- npm run format:check`, and `npm run verify -- npm test` to retain other required check output through the same evidence mechanism.

Dirty, changed, interrupted, source/build-mismatched, build-changed, routine-skipped-test, and canceled-test runs have `completedEvidence: false`. The two explicitly named optional Photon and official-raster probes may be skipped in routine verification; metadata records their names and intentional skip count. A green exit alone is insufficient to claim complete acceptance or a baseline. A generic command has no built-preview identity: its build and preview phases are explicitly skipped. Logs and metadata are evidence of the observed command, not proof of checks it did not run.

## Isolated baselines

Run `npm run test:baseline -- <commit-or-ref>` (optionally followed by the same focused selection). This resolves the ref to a commit, creates a detached temporary worktree, installs that revision's locked dependencies, builds it separately, and starts its own previews. Ongoing edits in the implementation checkout cannot alter that baseline source or build. Evidence identifies the detached revision and `kind: baseline`; the temporary checkout is removed afterward while artifacts remain. Keep the artifacts when recording before/after results.

For historical revisions using module overrides, the helper installs the current locked verification dependencies into a separate temporary tooling directory and supplies their generated paths. Setup artifacts capture installation output and installation failures or cancellation from process start. Metadata records `baselineToolingRevision` and its lock fingerprint separately from the baseline source revision. This tooling is not a modification of historical application source. Browser installation is a separate prerequisite; historical incompatible tests fail honestly.

Deployed host checks run separately with `PRODUCTION_ACCESS=1 npm run verify -- node --test tests/browser/production-access.test.mjs` and explicit HTTPS `HOME_TEST_URL` and `MAP_TEST_URL` where needed. The local browser runner rejects selecting this file, because local previews cannot prove production routing.
