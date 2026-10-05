import { useEffect, useState } from 'react';

let ReuiInstance;

async function getReui() {
  if (!ReuiInstance) {
    const mod = await import('reui/lib/Reui.js');
    ReuiInstance = mod.default ?? mod;
  }

  return ReuiInstance;
}

export default function ReuiDemo() {
  const [Reui, setReui] = useState(null);

  useEffect(() => {
    let active = true;

    getReui().then((loadedReui) => {
      if (active) {
        setReui(loadedReui);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCenter = () => {
    if (typeof window === 'undefined') return;

    const nextLocation = window.__gensaiCurrentLocation || {
      lng: 139.6917,
      lat: 35.6895,
    };
    const map = window.__gensaiMapInstance;

    if (map) {
      map.flyTo({ center: [nextLocation.lng, nextLocation.lat], zoom: 12 });
    }
  };

  if (!Reui) {
    return <div className="reui-loading">Loading panel…</div>;
  }

  return (
    <Reui.Panel title="Preparedness map">
      <p className="panel-copy">
        Use the map to check conditions near your current location.
      </p>
      <button
        type="button"
        className="reui-button reui-button--md reui-button--primary"
        onClick={handleCenter}
      >
        Center on me
      </button>
    </Reui.Panel>
  );
}
