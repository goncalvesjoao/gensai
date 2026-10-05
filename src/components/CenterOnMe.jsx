import { LocateFixed } from 'lucide-react';
import { Button } from './ui/button';

export default function CenterOnMe() {
  function handleCenter() {
    const location = window.__gensaiCurrentLocation || {
      lng: 139.6917,
      lat: 35.6895,
    };
    window.__gensaiMapInstance?.flyTo({
      center: [location.lng, location.lat],
      zoom: 12,
    });
  }

  return (
    <Button
      type="button"
      className="h-auto min-h-10 rounded-[10px] bg-linear-to-br from-primary to-primary-strong px-4 py-2.5 font-bold shadow-[0_10px_18px_rgba(15,118,110,0.18)]"
      onClick={handleCenter}
    >
      <LocateFixed aria-hidden="true" />
      Center on me
    </Button>
  );
}
