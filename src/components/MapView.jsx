import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

const TOKYO = { lng: 139.6917, lat: 35.6895 };

if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl(maplibreWorkerUrl);
}

// eslint-disable-next-line react/prop-types
export default function MapView({ locale = 'en' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [location, setLocation] = useState(TOKYO);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setIsReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };

        if (typeof window !== 'undefined') {
          window.__gensaiCurrentLocation = nextLocation;
        }

        setLocation(nextLocation);
        setIsReady(true);

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [nextLocation.lng, nextLocation.lat],
            zoom: 12,
          });
          const marker = new maplibregl.Marker({ color: '#ef4444' })
            .setLngLat([nextLocation.lng, nextLocation.lat])
            .addTo(mapRef.current);
          marker.getElement().title =
            locale === 'ja' ? '現在地' : 'Your location';
        }
      },
      () => {
        setIsReady(true);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [locale]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [location.lng, location.lat],
      zoom: 10,
      attributionControl: false,
    });

    if (typeof window !== 'undefined') {
      window.__gensaiMapInstance = map;
    }

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    mapRef.current = map;

    map.once('load', () => setIsReady(true));

    return () => {
      map.remove();
      mapRef.current = null;
      if (typeof window !== 'undefined' && window.__gensaiMapInstance === map) {
        delete window.__gensaiMapInstance;
      }
    };
  }, [location]);

  return (
    <>
      {!isReady && (
        <div className="absolute top-4 left-4 z-1 rounded-md bg-card px-3 py-2">
          {locale === 'ja' ? '地図を読み込み中…' : 'Loading map…'}
        </div>
      )}
      <div
        className="map-shell"
        ref={containerRef}
        aria-label={
          locale === 'ja'
            ? '現在地を中心とした地図'
            : 'Map centered on your location'
        }
      />
    </>
  );
}
