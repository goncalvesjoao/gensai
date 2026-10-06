# Gensai

Gensai aims to be a practical guide for disaster preparedness in Japan.

## Goal

Be the place people turn to for practical guidance before and during a disaster in Japan.

## Vision

Help people understand local risks, prepare before a disaster, and know what to do during one.

## The problem

Knowing that disaster preparedness resources exist is different from knowing how to use them. People need clear guidance on the risks where they live, how to prepare, and what to do when a disaster occurs. Local procedures and expectations can also be difficult to understand without prior knowledge.

Gensai aims to bring that guidance together in one place, with practical instructions that people can understand and act on.

## Audience

Gensai will initially support English and Japanese speakers, with additional languages and locales planned later.

| Audience             | Situation                                                                    |
| -------------------- | ---------------------------------------------------------------------------- |
| Prospective resident | Wants to understand local disaster risks before choosing where to live.      |
| Current resident     | Wants to build or improve their disaster kit and evacuation plan.            |
| Traveler             | Wants to know what to expect, what to do, and where to go during a disaster. |

## Current status

Gensai is in early development. The current prototype has a MapLibre GL JS map using demo tiles, automatic startup geolocation with a silent Tokyo fallback, and a "Center on me" button in a collapsible sidebar. Floating controls toggle the sidebar; the search field is layout only and does not search. The map lives at the root of the map subdomain; the main site address redirects to it. The prototype has English and Japanese routes, plus light and dark application themes.

The [product-spec index](docs/specs/index.md) provides portable, framework-independent
requirements for the map baseline, selected location, address search, official
hazards with coverage, and production access with release acceptance. Each feature
spec overrides baseline behavior where it explicitly changes it.
The [release overview](docs/first-release.md) defines the audience, outcome, scope
and exclusions. Each feature spec records its open decisions and acceptance
checks. These documents can be copied to another project without GitHub access
or the original implementation.

The [Excalidraw mockups](docs/mockups.excalidraw) define the first-release visual
and interaction direction. The [map-controls spec](docs/specs/map-controls.md)
records the floating controls and initially closed, explicitly dismissed hazard
menu. Feature specs add Enter submission for search and independent hazard switches.
These requirements are not implemented in the current prototype.

The [tracker index](docs/spec-tracking.md) maps the same feature structure to this
repository's issues and records delivery status. The release requires location
access only after "Use my location", with an explained Tokyo fallback if location
fails or is outside Japan. That behavior is not implemented yet.

Official hazard layers and preparedness guidance are not implemented yet. The planned hazard map will use official tiles and legends from Japan's [Hazard Map Portal](https://disaportal.gsi.go.jp/). The portal's [open-data catalogue](https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html) lists tile URLs, zoom levels, data providers, attribution requirements, and coverage notes.

Coverage varies by layer and region. The map will need to distinguish unavailable data from areas with no mapped hazard. Tile URLs and coverage will be checked against the official catalogue during implementation.

## First release URLs

The [production-access spec](docs/specs/release-acceptance.md) places a welcoming
home page at `https://gensai.help/` and the Gensai map at
`https://map.gensai.help/`. The home page will state that Gensai is a work in progress
and provide a prominent call to action to open the map. It will remain visible
without automatically redirecting. The map's home button will return to it.

English uses the root and Japanese uses `/ja` on both hosts. The home page's map
link opens the corresponding language route. Language switching on the map stays
on the map host. Both production hosts require HTTPS.

This welcome-page behavior is specified but not implemented. The current static
build still uses a browser redirect from the entry-point host to the map host,
preserving the path, query and fragment. In development, `http://localhost:4321/`
currently redirects to `http://map.localhost:4321/`; both hosts use the same server
port, including when it differs from 4321. Implementation must replace the
entry-point redirect with the welcome page and map link, including any hosting
redirect rules.

## Local development

The app uses Astro 7, React 19, MapLibre GL JS 6, and the official [ReUI](https://reui.io/docs/get-started)/shadcn registry workflow with Tailwind CSS 4. React components are written in JavaScript/JSX. Use Node.js 26.10.0, pinned in `.nvmrc`, and npm 9.6.5 or later. Other supported Node.js versions are `^22.22.3`, `^24.16.0`, or `>=26.3.0`.

If you use nvm, select the project's Node.js version first:

```bash
nvm install
nvm use
```

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [map.localhost:4321](http://map.localhost:4321) to view the map directly, or [localhost:4321](http://localhost:4321) to follow the redirect. If that port is occupied, use the port printed by the development server on both hosts. The demo map needs an internet connection to load its tiles. Allow location access to center it on your position; otherwise, it defaults to Tokyo.

### UI components and styling

Official ReUI is a source-code registry, **not** the unrelated npm `reui` package
from `voidxnull/reui`. Do not install `reui` or npm packages under `@reui`.
Following the current [ReUI setup](https://reui.io/docs/get-started) and
[registry guide](https://reui.io/docs/registry), `components.json` configures
`@reui` as `https://reui.io/r/{style}/{name}.json` with the `base-nova` style,
JavaScript output, and Lucide icons. No premium items or license keys are used.

The panel uses free stock shadcn Card sections and Button, adapted from the
official `base-nova` registry sources under `src/components/ui/`. These basics
install by bare name, not `@reui/card` or `@reui/button`:

```bash
npx shadcn@latest add card button
```

The local components retain only the sections, variants, and sizes needed here.
Reinstalling them can replace these adaptations; review the diff before accepting
overwrites. Free ReUI `c-*` components can be added using the `@reui/<name>`
namespace; consult that component's current docs for its name and dependencies.
Install only dependencies required by the chosen component, not the entire
catalog's animation or primitive libraries.

The theme and language controls reuse stock `base-nova` Button (ghost/icon size), Tooltip,
and DropdownMenu radio items. Their JSX adaptations live in `src/components/ui/`,
use the existing Base UI primitives, and omit optional animation utilities.
Before adding custom component CSS, check the configured shadcn/ReUI registries
and reuse or extend these local components. App-specific map sizing and responsive
page layout remain CSS; reusable controls use component styles and semantic tokens.

[Astro's Tailwind 4 integration](https://docs.astro.build/en/guides/styling/#tailwind)
uses `@tailwindcss/vite`, not the legacy `@astrojs/tailwind` integration.
`BaseLayout.astro` imports the global stylesheet, which imports Tailwind and maps
shadcn/ReUI semantic color tokens to the existing light palette. The responsive
page grid, collapsible sidebar, and map sizing remain plain CSS. The layout applies the saved
or system theme before first paint; dark-mode tokens also style the menu and
tooltips. English routes are unprefixed and Japanese routes use `/ja`; each page
renders only its selected language. The language menu navigates between
equivalent routes. Component-specific animation styles are not configured.

Following [Astro's framework component conventions](https://docs.astro.build/en/guides/framework-components/),
the layout and panel content stay in Astro. Card sections render as static HTML
without hydration. The React preference controls and centering button use `client:load` so their
actions are available immediately; the centering handler accesses the existing
browser map instance and uses Tokyo when geolocation is unavailable.
MapLibre stays in a `client:only="react"` island so its browser-only code is not
rendered on the server. No React root, theme provider, or PropTypes compatibility
shim is needed.

### Available commands

| Command                | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Start the development server.                                       |
| `npm run build`        | Create a production build.                                          |
| `npm run preview`      | Preview the production build locally after running `npm run build`. |
| `npm test`             | Build and check routing, locales, themes, sidebar and map worker.   |
| `npm run lint`         | Check JavaScript, JSX, and Astro files with ESLint.                 |
| `npm run lint:fix`     | Apply automatic ESLint fixes.                                       |
| `npm run format`       | Format the project with Prettier, including Astro files.            |
| `npm run format:check` | Check formatting without changing files.                            |

ESLint checks code correctness and React Hooks; Prettier handles formatting.
Generated files and the dependency lockfile are excluded from formatting.
The Node.js test suite checks built-page language output, locale navigation,
entry-point redirects, pre-paint themes, sidebar interactions and theme tokens.
It also checks that the emitted MapLibre worker and its relative
static imports are served successfully with JavaScript MIME types by Astro preview.
MapLibre 6's worker imports a shared module, so its Vite import must use
`.mjs?worker&url` to bundle that dependency; plain `?url` can work in development
but fail in production. See [MapLibre's Vite setup](https://maplibre.org/maplibre-gl-js/docs/).

### Project structure

- `src/pages/index.astro`: English map page.
- `src/pages/ja/index.astro`: Japanese map page.
- `src/layouts/BaseLayout.astro`: shared HTML layout, entry-point redirect, and theme initialization.
- `src/components/MapView.jsx`: map and browser geolocation.
- `src/components/MapLayout.astro`: floating toolbar and responsive sidebar toggles.
- `src/components/PreparednessPanel.astro`: static sidebar content.
- `src/components/PreferenceControls.jsx`: interactive theme and language controls.
- `src/lib/locale.mjs`: route language and locale navigation.
- `src/components/CenterOnMe.jsx`: interactive map centering button with a Lucide icon.
- `src/components/ui/`: local shadcn component sources.
- `src/styles/global.css`: Tailwind theme tokens and existing page/map styles.
- `components.json`: shadcn/ReUI registry setup.
- `tsconfig.json`: Astro configuration and `@/*` source alias for registry installs.
- `astro.config.mjs`: Astro, React, Tailwind Vite plugin, and server configuration.
- `tests/map-worker.test.mjs`: production worker request regression test.
- `tests/map-routing.test.mjs`: entry-point redirect checks.
- `tests/map-sidebar.test.mjs`: sidebar state, controls, focus and breakpoint checks.
- `tests/locale.test.mjs`: route language and locale navigation checks.
- `tests/preferences.test.mjs`: pre-paint theme checks.
- `tests/theme-styles.test.mjs`: runtime theme-token regression checks.

## License

[MIT](LICENSE).
