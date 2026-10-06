# Production home and map access

Ticket: [#28](https://github.com/goncalvesjoao/gensai/issues/28), part of
[release #12](https://github.com/goncalvesjoao/gensai/issues/12).

## Hosting and deployment

Reuse the existing Cloudflare Pages project `gensai`, connected to
`goncalvesjoao/gensai`. Its production branch is `main`, automatic deployments
are enabled, the build command is `npm run build`, output directory is `dist`,
and the repository root is the build root. Build system v3 is selected.
Both custom domains, `gensai.help` and `map.gensai.help`, are Active with SSL
enabled. Preview deployments remain protected by Cloudflare Access.

The repository's `functions/_middleware.js` internally serves `/welcome/` and
`/ja/welcome/` on the entry-point host. It also serves `/ja/` internally for
`map.gensai.help/ja`, avoiding the static host's trailing-slash redirect.
These are internal rewrites: the browser URL stays unchanged. `public/_routes.json`
limits function execution to `/`, `/ja`, and `/ja/`; assets stay static.
Cloudflare Pages automatically compiles the root `functions` directory alongside
the Astro build. No adapter, runtime dependency, secret, or account is required
by the visitor.

Normal deployment: publish a reviewed commit to `main` through an authorized
merge and wait for the Pages build to succeed. This delivery does not authorize
merging. When deploying a reviewed release branch before merge, select that exact
branch as the Pages production branch in Settings → Builds & deployments, trigger
the build, and verify its full commit SHA in Deployments. Restore `main` as the
production branch after the release deployment; confirm that the restored setting
has not replaced the release with an older artifact. Preserve preview access
protection. Record the deployed SHA and deployment ID before verifying public URLs.
Do not infer a production promotion option from preview deployment success.

## Repeatable verification

Install project dependencies and build with the pinned supported Node.js version:

```sh
npm ci
npm run build
npm run lint
npm run format:check
npm test
```

For a local check of the actual Pages routing runtime, use Cloudflare's official
CLI without adding a project dependency:

```sh
npm exec --yes --package=wrangler -- wrangler pages dev dist --port 4339 --compatibility-date=2026-10-05
curl -i -H 'Host: gensai.help' http://localhost:4339/
curl -i -H 'Host: gensai.help' http://localhost:4339/ja
curl -i -H 'Host: map.gensai.help' http://localhost:4339/ja
```

All three must return HTTP 200 without a Location header; the entry-point pages
must contain localized welcome headings and ordinary map links. Stop the local
server and remove its disposable `.wrangler` output before repository-wide checks.
This checks runtime routing only, not deployed availability.

Verify DNS and TLS without bypassing certificate checks:

```sh
dig +short gensai.help
dig +short map.gensai.help
curl -I https://gensai.help/
curl -I https://gensai.help/ja
curl -I https://map.gensai.help/
curl -I https://map.gensai.help/ja
```

Each HTTPS URL must return HTTP 200 directly with no Location header. Do not use
`curl -k` or follow redirects to hide a failed route.

Run the browser check against the real public hosts using an available Playwright
installation and Chromium executable (the existing browser suites use this same
runtime; no browser dependency is added here):

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
CHROMIUM_PATH=/absolute/path/to/chromium \
node --test tests/browser/production-access.test.mjs
```

The test checks both localized entry points with JavaScript enabled and disabled,
no initial HTTP redirect, readable welcome content, equivalent ordinary map links,
and no home-page geolocation request. It then checks direct map loading and the
localized map → home → map flow plus map-host language switching. Default hosts
are the production HTTPS domains; `HOME_TEST_URL` and `MAP_TEST_URL` allow explicit
alternate targets. Local or preview success does not replace the production run.

## Results recorded on 2026-10-07 (JST)

- Dashboard inspection: both custom domains Active/SSL enabled; production build
  `0c2ea948beec751a929335f4580dd07e16e73d86`, deployment
  `3cdb36d3-9765-4584-a609-b114669b2b8e`.
- Both hosts resolve publicly to Cloudflare addresses `104.21.0.75` and
  `172.67.128.124`. HTTPS requests validate certificates and return 200 at `/`.
- Before this fix, the entry point serves the map instead of the welcome, and
  both `/ja` URLs return HTTP 308 to `/ja/`. The first new production browser
  test fails waiting for the English welcome heading, confirming the defect.
- Local Wrangler runtime with the middleware: English/Japanese entry-point
  requests and direct Japanese map request return 200 without Location headers,
  and their expected localized HTML.
- These initial results preceded deployment. The corrected production evidence
  below supersedes their outstanding deployment status.

## Corrected production deployment

On 2026-10-07 at 02:02 JST, Cloudflare Pages successfully deployed reviewed
application commit `63c2bfbaf8af341467e3e067acf13f70b441124f`, deployment
`3397d33c-9078-42ba-be5a-db11a1410b44`. The delivery parent verified the exact
commit and successful build/Functions upload in Cloudflare. It temporarily set
the production branch to `codex/release-12` to deploy the reviewed change, then
restored `main` with automatic deployments enabled. Existing preview Access
protection remained in place. Later evidence-only commits do not change this
application artifact.

Independent public DNS checks resolved both hosts to `104.21.0.75` and
`172.67.128.124`. `curl` checks for `/` and `/ja` on both HTTPS hosts returned
200, TLS certificate verification result 0 and no redirects. The production
middleware now supplies the welcome on the entry-point host and the map on the
map host in both languages.

The eight deployed welcome screenshots (English/Japanese, light/dark,
390/1280px width) were captured and visually inspected. Text wraps without
horizontal clipping, the map action and its keyboard focus ring remain readable,
and the preference controls remain exposed. A Japanese phone dark-theme
home → map → home capture confirms the returned welcome and the visible Japan
overview. Evidence directory: `/tmp/gensai-release12/final-screenshots`.

The complete deployed browser suite passed 59/59 checks with zero failures and
zero skips, including both production-access checks, all welcome checks and
English/Japanese home → map → home navigation. Both actual Photon and official
raster probes also passed. Full output:
`/tmp/gensai-release12/final-deployed-browser.log`. This completes the required
production verification for the named artifact; parent #12 stays open for its
owner.

Production access verifies this navigation experience. It does not establish
completion of outstanding map features or comprehensive hazard coverage.
