import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { JAPAN_BOUNDS, isJapanLocation } from '../lib/selected-location.mjs';

if (typeof window !== 'undefined') maplibregl.setWorkerUrl(maplibreWorkerUrl);

// eslint-disable-next-line react/prop-types
export default function MapView({ locale = 'en' }) {
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const japanese = locale === 'ja';
  const text = japanese
    ? {
        map: '日本の地図',
        loading: '地図を読み込み中…',
        selected: '選択した場所',
        instruction:
          '地図をクリックして場所を選択。矢印キーで地図を移動し、Enterで中心を選択できます。',
        outside: '日本の陸地を選択してください。',
        latitude: '緯度',
        longitude: '経度',
        coordinates: '座標で場所を選択・修正',
        submit: '座標を選択',
      }
    : {
        map: 'Map of Japan',
        loading: 'Loading map…',
        selected: 'Selected location',
        instruction:
          'Click the map to choose a place. Use arrow keys to move the map, then Enter to select its center.',
        outside: 'Choose a point on land in Japan.',
        latitude: 'Latitude',
        longitude: 'Longitude',
        coordinates: 'Choose or correct coordinates',
        submit: 'Select coordinates',
      };

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution:
              '<a href="https://maps.gsi.go.jp/development/ichiran.html">GSI</a> | Shoreline: NIMA/USGS VMAP0 (1997)',
          },
        },
        layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
      },
      bounds: JAPAN_BOUNDS,
      fitBoundsOptions: { padding: 30 },
      maxZoom: 18,
      renderWorldCopies: false,
    });
    map.setMinZoom(map.getZoom());
    map.on('moveend', () => {
      const { lng, lat } = map.getCenter();
      const center = [
        Math.max(122.5, Math.min(154.5, lng)),
        Math.max(20, Math.min(46, lat)),
      ];
      if (lng !== center[0] || lat !== center[1]) map.jumpTo({ center });
    });
    window.__gensaiMapInstance = map;
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
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
    function select(location, explanation = '', label = text.selected) {
      const valid = isJapanLocation(location);
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
    window.dispatchEvent(new Event('gensai:map-ready'));
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);
    map.once('load', () => setReady(true));
    return () => {
      observer.disconnect();
      window.removeEventListener('gensai:select-location', receive);
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
      <div className="map-shell" ref={containerRef} aria-label={text.map} />
      <div className="map-selection">
        {!ready && <p>{text.loading}</p>}
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
    </>
  );
}
