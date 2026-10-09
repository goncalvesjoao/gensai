# Entry point and map routes

The static build includes `/welcome/index.html` and `/ja/welcome/index.html` for
the English and Japanese welcome pages. Map pages remain at `/index.html` and
`/ja/index.html` so map-host language switching keeps its root-/ja contract.

Local Astro development and preview serve the welcome pages at
`http://localhost:4321/` and `/ja` without redirects. Their normal links open
`http://map.localhost:4321/` and `/ja`. The map remains available on
`127.0.0.1:4321` for the existing repeatable browser checks.

Production hosting must serve the welcome files at `https://gensai.help/` and
`/ja` while serving the map files at `https://map.gensai.help/` and `/ja`.
Configure host-specific internal rewrites, not entry-point-to-map redirects.
Deployment and verification of these hosting rules remain ticket #28; emitting
the static pages does not establish that production serves them.

Run all local browser checks, including welcome navigation, with managed preview:

```sh
npm run test:setup
npm run test:browser
```

The runner sets `TEST_URL`, `HOME_TEST_URL` and `MAP_TEST_URL` to the same available
preview port, using `map.localhost` for the map and `localhost` for welcome. For an already running
preview, a single file can still be run directly:

```sh
HOME_TEST_URL=http://localhost:4321 MAP_TEST_URL=http://map.localhost:4321 node --test tests/browser/welcome.test.mjs
```

`PLAYWRIGHT_MODULE`, `PNG_MODULE` and `CHROMIUM_PATH` can override the installed
browser-test runtimes. See [test coverage](test-coverage.md) for retained checks.
