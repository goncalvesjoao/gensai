# Browser verification

Start with `package.json` for public verification commands and
`tests/browser/helpers.mjs` for shared fixtures and synchronization helpers.
Reuse `selectThemeMode` and `waitForScaleChange` when changing appearance or zoom.
Wait for the rendered state asserted by the test, with a bounded timeout. For
Node-side route counts or screenshot pixels, use the shared bounded condition
helper instead of open-ended polling. Fixed readiness sleeps fail browser lint;
a deliberate elapsed-time assertion needs a local disable comment explaining
why elapsed time is the behavior being checked.

Routine browser acceptance uses controlled provider responses. Those checks
cover rendering and interaction; they do not establish provider availability
or geographic coverage. Live-provider and deployed-site probes are opt-in.

Use the browser runner's focused selection while changing a case, then run the
full deterministic suite before publication. Inspect the runner's help for
selection, probe and evidence options. Retain output from process start,
including initial red tests, with the source revision, checkout, dirty state,
build, command, elapsed time and exit status. Keep local logs outside tracked
source. Compare runtimes only for equivalent scope and environments, and
record skipped, canceled or changed-source runs honestly.
