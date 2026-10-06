import { useEffect, useRef, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { TOKYO, isJapanLocation } from '../lib/selected-location.mjs';

// eslint-disable-next-line react/prop-types
export default function UseMyLocation({ locale = 'en' }) {
  const request = useRef(0);
  const [pending, setPending] = useState(false);
  const [available, setAvailable] = useState(false);
  const japanese = locale === 'ja';
  const text = japanese
    ? {
        button: '現在地を取得',
        pending: '現在地を取得中…',
        current: '選択した場所（端末の現在地）',
        fallback: '選択した場所（東京への代替表示）',
        denied: '位置情報へのアクセスが許可されませんでした。',
        unavailable: '端末の位置情報を取得できませんでした。',
        timeout: '位置情報の取得がタイムアウトしました。',
        outside: '端末の位置は日本の陸地ではありません。',
        explanation:
          '東京を代わりに表示しています。検出された現在地ではありません。日本の場所を選択・修正できます。',
      }
    : {
        button: 'Use my location',
        pending: 'Finding your location…',
        current: 'Selected location (device position)',
        fallback: 'Selected location (Tokyo fallback)',
        denied: 'Location permission was denied.',
        unavailable: 'Device location is unavailable.',
        timeout: 'Device location request timed out.',
        outside: 'Device location is outside land in Japan.',
        explanation:
          'Showing Tokyo as a fallback, not your detected current location. You can choose or correct a place in Japan.',
      };

  useEffect(() => {
    const ready = () => setAvailable(true);
    const cancel = () => {
      request.current++;
      setPending(false);
    };
    if (window.__gensaiMapInstance) ready();
    window.addEventListener('gensai:map-ready', ready);
    window.addEventListener('gensai:selection-result', cancel);
    return () => {
      cancel();
      window.removeEventListener('gensai:map-ready', ready);
      window.removeEventListener('gensai:selection-result', cancel);
    };
  }, []);

  function acquire() {
    const active = ++request.current;
    setPending(true);
    function finish(location, cause) {
      if (active !== request.current) return;
      setPending(false);
      window.dispatchEvent(
        new CustomEvent('gensai:select-location', {
          detail: {
            location: cause ? TOKYO : location,
            label: cause ? text.fallback : text.current,
            explanation: cause ? `${cause} ${text.explanation}` : '',
          },
        }),
      );
    }
    if (!navigator.geolocation) return finish(null, text.unavailable);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lng: coords.longitude, lat: coords.latitude };
        finish(location, isJapanLocation(location) ? null : text.outside);
      },
      ({ code }) =>
        finish(
          null,
          code === 1
            ? text.denied
            : code === 3
              ? text.timeout
              : text.unavailable,
        ),
      { maximumAge: 0, timeout: 10000, enableHighAccuracy: true },
    );
  }

  return (
    <>
      <button
        type="button"
        className="map-control device-location"
        disabled={!available}
        aria-busy={pending}
        onClick={acquire}
      >
        <LocateFixed size={18} aria-hidden="true" />
        <span>{text.button}</span>
      </button>
      <span className="device-location-progress" aria-live="polite">
        {pending ? text.pending : ''}
      </span>
    </>
  );
}
