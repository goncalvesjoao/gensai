import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TOKYO = { lng: 139.6917, lat: 35.6895 };

export default function MapView() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [location, setLocation] = useState(TOKYO);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };
        setLocation(nextLocation);

        if (mapRef.current) {
          mapRef.current.flyTo({ center: [nextLocation.lng, nextLocation.lat], zoom: 12 });
          const marker = new maplibregl.Marker({ color: '#ef4444' })
            .setLngLat([nextLocation.lng, nextLocation.lat])
            .addTo(mapRef.current);
          marker.getElement().title = 'Your location';
        }
      },
      () => {
        // Fall back to Tokyo if the browser denies location access.
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [location.lng, location.lat],
      zoom: 10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [location]);

  return <div className="map-shell" ref={containerRef} aria-label="Map centered on your location" />;
}
