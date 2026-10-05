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

Gensai is in early development. The current prototype has a MapLibre GL JS map using demo tiles, browser geolocation with a Tokyo fallback, and a "Center on me" button in a ReUI panel. The interface is currently in English.

Official hazard layers, preparedness guidance, and Japanese language support are not implemented yet. The planned hazard map will use official tiles and legends from Japan's [Hazard Map Portal](https://disaportal.gsi.go.jp/). The portal's [open-data catalogue](https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html) lists tile URLs, zoom levels, data providers, attribution requirements, and coverage notes.

Coverage varies by layer and region. The map will need to distinguish unavailable data from areas with no mapped hazard. Tile URLs and coverage will be checked against the official catalogue during implementation.

## Local development

The app uses Astro 7, React 19, MapLibre GL JS 6, and the official [ReUI](https://reui.io/docs/get-started)/shadcn registry workflow with Tailwind CSS 4. React components are written in JavaScript/JSX. You need Node.js 22.12.0 or later and npm 9.6.5 or later.

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [localhost:4321](http://localhost:4321) to view the app. If that port is occupied, use the URL printed by the development server. The demo map needs an internet connection to load its tiles. Allow location access to center it on your position; otherwise, it defaults to Tokyo.

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

The local components retain only the sections/default button variant needed here.
Reinstalling them can replace these adaptations; review the diff before accepting
overwrites. Free ReUI `c-*` components can be added using the `@reui/<name>`
namespace; consult that component's current docs for its name and dependencies.
Install only dependencies required by the chosen component, not the entire
catalog's animation or primitive libraries.

[Astro's Tailwind 4 integration](https://docs.astro.build/en/guides/styling/#tailwind)
uses `@tailwindcss/vite`, not the legacy `@astrojs/tailwind` integration.
`BaseLayout.astro` imports the global stylesheet, which imports Tailwind and maps
shadcn/ReUI semantic color tokens to the existing light palette. The existing
page grid, sidebar, and map sizing remain plain CSS. Dark mode and component-specific
animation styles are not configured; add them only when needed.

Following [Astro's framework component conventions](https://docs.astro.build/en/guides/framework-components/),
the layout and panel content stay in Astro. Card sections render as static HTML
without hydration. Only the React centering button uses `client:load`, since its
action should be available immediately; its click handler accesses the existing
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
| `npm run lint`         | Check JavaScript, JSX, and Astro files with ESLint.                 |
| `npm run lint:fix`     | Apply automatic ESLint fixes.                                       |
| `npm run format`       | Format the project with Prettier, including Astro files.            |
| `npm run format:check` | Check formatting without changing files.                            |

ESLint checks code correctness and React Hooks; Prettier handles formatting.
Generated files and the dependency lockfile are excluded from formatting.
No automated test suite is configured. The current `npm test` script is a placeholder that exits with an error.

### Project structure

- `src/pages/index.astro`: home page.
- `src/layouts/BaseLayout.astro`: shared HTML layout and global stylesheet import.
- `src/components/MapView.jsx`: map and browser geolocation.
- `src/components/PreparednessPanel.astro`: static sidebar panel.
- `src/components/CenterOnMe.jsx`: interactive map centering button with a Lucide icon.
- `src/components/ui/`: local shadcn component sources.
- `src/styles/global.css`: Tailwind theme tokens and existing page/map styles.
- `components.json`: shadcn/ReUI registry setup.
- `tsconfig.json`: Astro configuration and `@/*` source alias for registry installs.
- `astro.config.mjs`: Astro, React, Tailwind Vite plugin, and server configuration.

## License

[MIT](LICENSE).
