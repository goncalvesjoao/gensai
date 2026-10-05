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

| Audience | Situation |
| --- | --- |
| Prospective resident | Wants to understand local disaster risks before choosing where to live. |
| Current resident | Wants to build or improve their disaster kit and evacuation plan. |
| Traveler | Wants to know what to expect, what to do, and where to go during a disaster. |

## Current status

Gensai is in early development. The current prototype has a MapLibre GL JS map using demo tiles, browser geolocation with a Tokyo fallback, and a "Center on me" button in a ReUI panel. The interface is currently in English.

Official hazard layers, preparedness guidance, and Japanese language support are not implemented yet. The planned hazard map will use official tiles and legends from Japan's [Hazard Map Portal](https://disaportal.gsi.go.jp/). The portal's [open-data catalogue](https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html) lists tile URLs, zoom levels, data providers, attribution requirements, and coverage notes.

Coverage varies by layer and region. The map will need to distinguish unavailable data from areas with no mapped hazard. Tile URLs and coverage will be checked against the official catalogue during implementation.

## Local development

The app uses Astro 7, React 19, MapLibre GL JS 6, ReUI, and plain CSS. React components are written in JavaScript/JSX. You need Node.js 22.12.0 or later and npm 9.6.5 or later.

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [localhost:4321](http://localhost:4321) to view the app. If that port is occupied, use the URL printed by the development server. The demo map needs an internet connection to load its tiles. Allow location access to center it on your position; otherwise, it defaults to Tokyo.

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run preview` | Preview the production build locally after running `npm run build`. |

No lint command or automated test suite is configured. The current `npm test` script is a placeholder that exits with an error.

### Project structure

- `src/pages/index.astro`: home page.
- `src/layouts/BaseLayout.astro`: shared HTML layout and ReUI theme setup.
- `src/components/MapView.jsx`: map and browser geolocation.
- `src/components/ReuiDemo.jsx`: sidebar panel and map centering button.
- `src/styles/global.css`: global styles.
- `astro.config.mjs`: Astro, React integration, and server configuration.

## License

[MIT](LICENSE).
