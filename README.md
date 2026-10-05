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

Gensai is in early development. The current prototype has a MapLibre GL JS map using demo tiles, browser geolocation with a Tokyo fallback, and a "Center on me" button in a ReUI panel. The map lives at the root of the map subdomain; the main site address redirects to it. The prototype has English and Japanese routes.

Official hazard layers and preparedness guidance are not implemented yet. The planned hazard map will use official tiles and legends from Japan's [Hazard Map Portal](https://disaportal.gsi.go.jp/). The portal's [open-data catalogue](https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html) lists tile URLs, zoom levels, data providers, attribution requirements, and coverage notes.

Coverage varies by layer and region. The map will need to distinguish unavailable data from areas with no mapped hazard. Tile URLs and coverage will be checked against the official catalogue during implementation.

## First release URLs

The [first-release spec](docs/first-release.md) places the Gensai map at
`https://map.gensai.help/`, with `https://gensai.help/` redirecting to it.
In development, `http://localhost:4321/` redirects to
`http://map.localhost:4321/`. Both development hosts use the same server port,
including when it differs from 4321.

English uses the map host's root and Japanese uses `/ja`. The entry point's
`/ja` route redirects to `/ja` on the map host. Language switching stays on the
map host.

The static build uses a browser redirect in the page head for the entry-point
host, preserving the path, query string, and fragment. Serve the same `dist/`
build on both production hosts with HTTPS. DNS and hosting setup are required
before the production URLs are live. When a hosting provider is chosen, configure
an HTTP redirect there so the entry point also redirects without JavaScript.

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
shadcn/ReUI semantic color tokens to the existing light palette. The existing
page grid, sidebar, and map sizing remain plain CSS. The layout applies the saved
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
| `npm test`             | Build and check production map worker requests through preview.     |
| `npm run lint`         | Check JavaScript, JSX, and Astro files with ESLint.                 |
| `npm run lint:fix`     | Apply automatic ESLint fixes.                                       |
| `npm run format`       | Format the project with Prettier, including Astro files.            |
| `npm run format:check` | Check formatting without changing files.                            |

ESLint checks code correctness and React Hooks; Prettier handles formatting.
Generated files and the dependency lockfile are excluded from formatting.
The Node.js test suite checks that the emitted MapLibre worker and its relative
static imports are served successfully with JavaScript MIME types by Astro preview.
MapLibre 6's worker imports a shared module, so its Vite import must use
`.mjs?worker&url` to bundle that dependency; plain `?url` can work in development
but fail in production. See [MapLibre's Vite setup](https://maplibre.org/maplibre-gl-js/docs/).

### Project structure

- `src/pages/index.astro`: English map page.
- `src/pages/ja/index.astro`: Japanese map page.
- `src/layouts/BaseLayout.astro`: shared HTML layout, entry-point redirect, and theme initialization.
- `src/components/MapView.jsx`: map and browser geolocation.
- `src/components/PreparednessPanel.astro`: static sidebar panel.
- `src/components/CenterOnMe.jsx`: interactive map centering button with a Lucide icon.
- `src/components/ui/`: local shadcn component sources.
- `src/styles/global.css`: Tailwind theme tokens and existing page/map styles.
- `components.json`: shadcn/ReUI registry setup.
- `tsconfig.json`: Astro configuration and `@/*` source alias for registry installs.
- `astro.config.mjs`: Astro, React, Tailwind Vite plugin, and server configuration.
- `tests/map-worker.test.mjs`: production worker request regression test.
- `tests/map-routing.test.mjs`: entry-point redirect checks.

## License

[MIT](LICENSE).
