import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import UseMyLocation from './UseMyLocation.jsx';
import { isJapanLocation } from '../lib/selected-location.mjs';

// eslint-disable-next-line react/prop-types
export default function AddressSearch({ locale = 'en' }) {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [choices, setChoices] = useState([]);
  const input = useRef(null);
  const [available, setAvailable] = useState(false);
  const request = useRef(0);
  const controller = useRef(null);
  const japanese = locale === 'ja';
  const text = japanese
    ? {
        search: '場所を検索',
        pending: '住所を検索中…',
        empty:
          '日本の検索結果がありません。住所を短くするか、地図で場所を選択してください。',
        failed:
          '住所を検索できませんでした。再試行するか、地図で場所を選択してください。',
        multiple: '複数の場所が見つかりました。目的の場所を選択してください。',
        limited:
          '検索結果の一部を表示しています。他にも候補がある場合があります。市区町村や住所を追加すると絞り込めます。',
        choose: '場所を選択',
        selected: '選択した場所',
      }
    : {
        search: 'Search for a location',
        pending: 'Searching for an address…',
        empty:
          'No supported Japan results. Try a shorter address or choose a point on the map.',
        failed:
          'Address search failed. Try again or choose a point on the map.',
        multiple: 'Multiple places found. Choose the intended place.',
        limited:
          'Showing some matches. More places may match. Add a city or more address details to narrow the search.',
        choose: 'Select',
        selected: 'Selected location',
      };

  function cancel() {
    request.current++;
    controller.current?.abort();
    setChoices([]);
    setMessage('');
  }

  function choose(match) {
    window.dispatchEvent(
      new CustomEvent('gensai:select-location', {
        detail: {
          location: match.location,
          label: `${text.selected}: ${match.label}`,
        },
      }),
    );
    input.current?.focus();
  }

  useEffect(() => {
    const ready = () => setAvailable(true);
    if (window.__gensaiMapInstance) ready();
    window.addEventListener('gensai:map-ready', ready);
    window.addEventListener('gensai:selection-start', cancel);
    return () => {
      cancel();
      window.removeEventListener('gensai:map-ready', ready);
      window.removeEventListener('gensai:selection-start', cancel);
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    window.dispatchEvent(new Event('gensai:selection-start'));
    if (!query.trim() || !available) return;
    const active = ++request.current;
    const abort = new AbortController();
    controller.current = abort;
    setMessage(text.pending);
    try {
      const url = new URL('https://photon.komoot.io/api/');
      url.search = new URLSearchParams({
        q: query.trim(),
        countrycode: 'JP',
        limit: '10',
        // Photon returns local names when the requested language is unavailable.
        lang: japanese ? 'default' : 'en',
      }).toString();
      const response = await fetch(url, {
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
      });
      if (!response.ok) throw new Error('Provider request failed');
      const data = await response.json();
      if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features))
        throw new Error('Invalid provider response');
      const matches = [];
      for (const feature of data.features) {
        const properties = feature?.properties;
        const coordinates = feature?.geometry?.coordinates;
        if (
          feature?.geometry?.type !== 'Point' ||
          !Array.isArray(coordinates) ||
          coordinates.length !== 2 ||
          !coordinates.every(Number.isFinite) ||
          !properties ||
          typeof properties.countrycode !== 'string'
        )
          throw new Error('Invalid provider result');
        const location = { lng: coordinates[0], lat: coordinates[1] };
        const label = [
          ...new Set(
            [
              properties.name,
              properties.housenumber,
              properties.street,
              properties.locality,
              properties.district,
              properties.city,
              properties.county,
              properties.state,
              properties.postcode,
            ].filter((value) => typeof value === 'string' && value.trim()),
          ),
        ].join(', ');
        if (!label) throw new Error('Missing provider label');
        if (
          properties.countrycode.toUpperCase() === 'JP' &&
          (await isJapanLocation(location))
        )
          matches.push({ location, label });
      }
      if (active !== request.current) return;
      if (matches.length === 1) {
        choose(matches[0]);
      } else {
        setChoices(matches);
        setMessage(
          matches.length
            ? data.features.length >= 10
              ? text.limited
              : text.multiple
            : text.empty,
        );
      }
    } catch {
      if (active === request.current) setMessage(text.failed);
    }
  }

  return (
    <form className="map-search" onSubmit={submit}>
      <Search size={18} aria-hidden="true" />
      <input
        ref={input}
        type="search"
        aria-label={text.search}
        placeholder={text.search}
        maxLength={300}
        value={query}
        onChange={(event) => {
          cancel();
          setQuery(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing && event.key === 'Enter')
            event.preventDefault();
        }}
        aria-describedby="address-search-feedback"
      />
      <UseMyLocation locale={locale} />
      <div className="address-search-panel">
        <p id="address-search-feedback" aria-live="polite">
          {message}
        </p>
        {choices.length > 0 && (
          <ul className="address-search-choices" aria-label={text.choose}>
            {choices.map((match, index) => (
              <li key={index}>
                <button
                  type="button"
                  aria-label={
                    japanese
                      ? `${match.label}を選択`
                      : `${text.choose} ${match.label}`
                  }
                  onClick={() => choose(match)}
                >
                  {match.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        <small>
          <a href="https://photon.komoot.io/">Photon</a> · ©{' '}
          <a href="https://www.openstreetmap.org/copyright">
            OpenStreetMap contributors
          </a>
        </small>
      </div>
    </form>
  );
}
