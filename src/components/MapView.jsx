import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import HazardLegend from './HazardLegend.jsx';
import { HAZARD_SOURCES } from '../lib/hazard-sources.mjs';
import { JAPAN_BOUNDS, isJapanLocation } from '../lib/selected-location.mjs';

if (typeof window !== 'undefined') maplibregl.setWorkerUrl(maplibreWorkerUrl);

// eslint-disable-next-line react/prop-types
export default function MapView({ locale = 'en' }) {
  const containerRef = useRef(null);
  const [categories, setCategories] = useState({
    tsunami: true,
    flooding: false,
    landslide: false,
  });
  const [statuses, setStatuses] = useState({});
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const japanese = locale === 'ja';
  const text = japanese
    ? {
        map: '日本の地図',
        loading: '地図を読み込み中…',
        mapFailed:
          '背景地図を読み込めませんでした。ハザードデータは利用できる場合があります。',
        selected: '選択した場所',
        instruction:
          '地図をクリックして場所を選択。矢印キーで地図を移動し、Enterで中心を選択できます。',
        outside: '日本の陸地を選択してください。',
        checking: '選択した場所を確認中…',
        failed:
          '日本の境界データを読み込めませんでした。ページを再読み込みしてお試しください。',
        latitude: '緯度',
        longitude: '経度',
        coordinates: '座標で場所を選択・修正',
        submit: '座標を選択',
      }
    : {
        map: 'Map of Japan',
        loading: 'Loading map…',
        mapFailed:
          'Could not load the basemap. Hazard data may still be available.',
        selected: 'Selected location',
        instruction:
          'Click the map to choose a place. Use arrow keys to move the map, then Enter to select its center.',
        outside: 'Choose a point on land in Japan.',
        checking: 'Checking selected location…',
        failed:
          'Could not load the Japan boundary. Reload the page to try again.',
        latitude: 'Latitude',
        longitude: 'Longitude',
        coordinates: 'Choose or correct coordinates',
        submit: 'Select coordinates',
      };

  useEffect(() => {
    const rasterSources = [
      {
        id: 'basemap',
        url: 'https://cyberjapandata.gsi.go.jp/xyz/pale',
        maxzoom: 18,
      },
      ...HAZARD_SOURCES.map((source) => ({
        ...source,
        url: `https://disaportaldata.gsi.go.jp/raster/${source.path}`,
        maxzoom: 17,
      })),
    ];
    const tileResults = new Map();
    let activeCategories = {};
    let styleReady = false;
    let disposed = false;
    function tileUrl(source, tile) {
      return `${source.url}/${tile.z}/${tile.x}/${tile.y}.png`;
    }
    function reconcile() {
      if (!styleReady || disposed) return;
      const next = {};
      for (const source of rasterSources) {
        if (source.id !== 'basemap' && !activeCategories[source.category])
          continue;
        const results = map
          .coveringTiles({
            tileSize: 256,
            minzoom: 2,
            maxzoom: source.maxzoom,
            roundZoom: true,
          })
          .map(
            (tile) =>
              tileResults.get(tileUrl(source, tile.canonical))?.status ??
              'loading',
          );
        const status =
          ['failed', 'unavailable', 'loading'].find((value) =>
            results.includes(value),
          ) ?? 'loaded';
        if (source.id === 'basemap') {
          setReady(status !== 'loading');
          setMapFailed(status === 'failed' || status === 'unavailable');
        } else next[source.id] = status;
      }
      setStatuses(next);
    }
    // MapLibre suppresses 404 events and considers errored cached tiles loaded.
    // Keep outcomes per requested URL, then inspect the public viewport tile set.
    maplibregl.addProtocol('gensai-raster', async (request, controller) => {
      const url = request.url.replace('gensai-raster://', '');
      const previous = tileResults.get(url);
      const result = {
        status:
          previous?.status === 'failed' || previous?.status === 'unavailable'
            ? previous.status
            : 'loading',
      };
      tileResults.set(url, result);
      reconcile();
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          result.status = response.status === 404 ? 'unavailable' : 'failed';
          const error = new Error(
            `Map tile request returned ${response.status}`,
          );
          error.status = response.status;
          throw error;
        }
        const data = await response.arrayBuffer();
        result.status = 'loaded';
        return { data };
      } catch (error) {
        if (controller.signal.aborted) {
          if (tileResults.get(url) === result) {
            if (previous) tileResults.set(url, previous);
            else tileResults.delete(url);
          }
        } else if (!error.status) result.status = 'failed';
        throw error;
      } finally {
        reconcile();
      }
    });
    const map = new maplibregl.Map({
      container: containerRef.current,
      attributionControl: { compact: true },
      style: {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: [
              'gensai-raster://https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            minzoom: 2,
            maxzoom: 18,
            attribution:
              '<a href="https://maps.gsi.go.jp/development/ichiran.html">GSI</a>',
          },
        },
        layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
      },
      bounds: JAPAN_BOUNDS,
      fitBoundsOptions: { padding: 30 },
      maxZoom: 18,
      renderWorldCopies: false,
    });
    function updateHazards(event) {
      activeCategories =
        event?.detail ??
        Object.fromEntries(
          [...document.querySelectorAll('[data-hazard-category]')].map(
            (input) => [input.dataset.hazardCategory, input.checked],
          ),
        );
      setCategories(activeCategories);
      if (!styleReady) return;
      for (const source of HAZARD_SOURCES) {
        if (!map.getSource(source.id)) {
          map.addSource(source.id, {
            type: 'raster',
            tileSize: 256,
            minzoom: 2,
            maxzoom: 17,
            tiles: [
              `gensai-raster://https://disaportaldata.gsi.go.jp/raster/${source.path}/{z}/{x}/{y}.png`,
            ],
          });
          map.addLayer({
            id: source.id,
            source: source.id,
            type: 'raster',
            layout: {
              visibility: activeCategories[source.category]
                ? 'visible'
                : 'none',
            },
            paint: {
              'raster-opacity': 1,
              'raster-fade-duration': 0,
              'raster-resampling': 'nearest',
            },
          });
        } else
          map.setLayoutProperty(
            source.id,
            'visibility',
            activeCategories[source.category] ? 'visible' : 'none',
          );
      }
      reconcile();
    }
    document.addEventListener('gensai:hazards-change', updateHazards);
    map.once('style.load', () => {
      styleReady = true;
      updateHazards();
    });
    map.on('moveend', reconcile);
    map.on('sourcedata', reconcile);
    map.on('idle', reconcile);
    map.on('error', (event) => {
      // Decode errors occur after a successful download; retain that tile's failure.
      const source = rasterSources.find((item) => item.id === event.sourceId);
      const tile = event.tile?.tileID?.canonical;
      if (source && tile)
        tileResults.set(tileUrl(source, tile), {
          status: event.error?.status === 404 ? 'unavailable' : 'failed',
        });
      reconcile();
    });
    map.setMinZoom(map.getZoom());
    const [[west, south], [east, north]] = JAPAN_BOUNDS;
    map.on('moveend', () => {
      const { lng, lat } = map.getCenter();
      const center = [
        Math.max(west, Math.min(east, lng)),
        Math.max(south, Math.min(north, lat)),
      ];
      if (Math.abs(lng - center[0]) > 1e-7 || Math.abs(lat - center[1]) > 1e-7)
        map.jumpTo({ center });
    });
    window.__gensaiMapInstance = map;
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'bottom-right',
    );
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    for (const [selector, label] of [
      ['.maplibregl-ctrl-zoom-in', japanese ? '拡大' : 'Zoom in'],
      ['.maplibregl-ctrl-zoom-out', japanese ? '縮小' : 'Zoom out'],
      [
        '.maplibregl-ctrl-compass',
        japanese ? '北を上にする' : 'Reset bearing to north',
      ],
      [
        '.maplibregl-ctrl-attrib-button',
        japanese ? '地図の出典' : 'Map attribution',
      ],
    ]) {
      const button = containerRef.current.querySelector(selector);
      button?.setAttribute('aria-label', label);
      button?.setAttribute('title', label);
    }

    const canvas = map.getCanvas();
    canvas.setAttribute('aria-label', text.map);
    canvas.setAttribute('aria-describedby', 'map-selection-instructions');
    let marker;
    let selection = 0;
    async function select(location, explanation = '', label = text.selected) {
      window.dispatchEvent(new Event('gensai:selection-start'));
      const active = ++selection;
      setMessage(text.checking);
      let valid;
      try {
        valid = await isJapanLocation(location);
      } catch {
        if (active === selection) setMessage(text.failed);
        return;
      }
      if (active !== selection) return;
      if (valid) {
        const next = { lng: location.lng, lat: location.lat };
        setSelected({ ...next, label });
        setCoordinates({ lat: String(next.lat), lng: String(next.lng) });
        setMessage(explanation);
        marker ??= new maplibregl.Marker({ color: '#ef4444' })
          .setLngLat([next.lng, next.lat])
          .addTo(map);
        marker.setLngLat([next.lng, next.lat]);
        marker.getElement().title = `${label}: ${next.lat.toFixed(5)}, ${next.lng.toFixed(5)}`;
        marker
          .getElement()
          .setAttribute('aria-label', marker.getElement().title);
        map.jumpTo({
          center: [next.lng, next.lat],
          zoom: Math.max(12, map.getZoom()),
        });
      } else setMessage(text.outside);
      window.dispatchEvent(
        new CustomEvent('gensai:selection-result', {
          detail: { valid, location },
        }),
      );
    }
    function cancel() {
      selection++;
      setMessage('');
    }
    function receive(event) {
      select(
        event.detail?.location,
        event.detail?.explanation,
        event.detail?.label,
      );
    }
    function keyboard(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        select(map.getCenter());
      }
    }
    map.on('click', (event) => select(event.lngLat));
    canvas.addEventListener('keydown', keyboard);
    window.addEventListener('gensai:select-location', receive);
    window.addEventListener('gensai:selection-start', cancel);
    window.dispatchEvent(new Event('gensai:map-ready'));
    function resize() {
      map.resize();
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);

    return () => {
      disposed = true;
      selection++;
      document.removeEventListener('gensai:hazards-change', updateHazards);
      observer.disconnect();
      maplibregl.removeProtocol('gensai-raster');
      window.removeEventListener('gensai:select-location', receive);
      window.removeEventListener('gensai:selection-start', cancel);
      canvas.removeEventListener('keydown', keyboard);
      marker?.remove();
      map.remove();
      if (window.__gensaiMapInstance === map) delete window.__gensaiMapInstance;
    };
    // Locale changes navigate to a fresh page. In-page state stays with this map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event) {
    event.preventDefault();
    window.dispatchEvent(
      new CustomEvent('gensai:select-location', {
        detail: {
          location: {
            lat: Number(coordinates.lat),
            lng: Number(coordinates.lng),
          },
        },
      }),
    );
  }

  return (
    <>
      <div className="map-viewport">
        <div className="map-shell" ref={containerRef} aria-label={text.map} />
        <div className="map-selection">
          {!ready && <p>{text.loading}</p>}
          {mapFailed && <p role="alert">{text.mapFailed}</p>}
          <p id="map-selection-instructions">{text.instruction}</p>
          <p role="status" aria-live="polite">
            {selected &&
              `${selected.label}: ${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`}
            {message && <span className="block">{message}</span>}
          </p>
          <details>
            <summary>{text.coordinates}</summary>
            <form onSubmit={submit}>
              <label>
                {text.latitude}
                <input
                  aria-label={text.latitude}
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  required
                  value={coordinates.lat}
                  onChange={(event) =>
                    setCoordinates({ ...coordinates, lat: event.target.value })
                  }
                />
              </label>
              <label>
                {text.longitude}
                <input
                  aria-label={text.longitude}
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  required
                  value={coordinates.lng}
                  onChange={(event) =>
                    setCoordinates({ ...coordinates, lng: event.target.value })
                  }
                />
              </label>
              <button type="submit">{text.submit}</button>
            </form>
          </details>
        </div>
      </div>
      <HazardLegend
        japanese={japanese}
        categories={categories}
        statuses={statuses}
      />
    </>
  );
}
