// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import AddressSearch from '../../src/components/AddressSearch.jsx';
import * as selection from '../../src/lib/selected-location.mjs';

const match = (name, lng = 139.6917, lat = 35.6895, countrycode = 'JP') => ({
  type: 'Feature',
  properties: { name, countrycode },
  geometry: { type: 'Point', coordinates: [lng, lat] },
});
let requests;
let selected;
let receive;

beforeEach(() => {
  window.__gensaiMapInstance = {};
  requests = [];
  selected = [];
  receive = (event) => selected.push(event.detail);
  window.addEventListener('gensai:select-location', receive);
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((success, failure, options) =>
        requests.push({ success, failure, options }),
      ),
    },
  });
});
afterEach(() => {
  cleanup();
  window.removeEventListener('gensai:select-location', receive);
  delete window.__gensaiMapInstance;
  vi.unstubAllGlobals();
});

function provider(features = []) {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ type: 'FeatureCollection', features }),
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
function submit(query = ' Tokyo ') {
  const input = screen.getByRole('searchbox');
  fireEvent.change(input, { target: { value: query } });
  fireEvent.submit(input.closest('form'));
}

for (const locale of ['en', 'ja']) {
  describe(locale, () => {
    test('address submission uses the selected language and selects one supported result', async () => {
      const fetch = provider([match('Tokyo')]);
      render(<AddressSearch locale={locale} />);
      expect(requests).toHaveLength(0);
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: ' Tokyo ' },
      });
      expect(fetch).not.toHaveBeenCalled();
      fireEvent.submit(screen.getByRole('searchbox').closest('form'));
      await waitFor(() => expect(selected).toHaveLength(1));
      const url = new URL(fetch.mock.calls[0][0]);
      expect(Object.fromEntries(url.searchParams)).toEqual({
        q: 'Tokyo',
        countrycode: 'JP',
        limit: '10',
        lang: locale === 'ja' ? 'default' : 'en',
      });
      expect(selected[0]).toEqual({
        location: selection.TOKYO,
        label: `${locale === 'ja' ? '選択した場所' : 'Selected location'}: Tokyo`,
      });
      expect(document.activeElement).toBe(screen.getByRole('searchbox'));
    });

    test.each([
      ['empty', []],
      ['foreign country', [match('Seoul', 126.978, 37.5665, 'KR')]],
      ['false Japan claim', [match('Seoul', 126.978, 37.5665)]],
    ])(
      'address %s results explain that no supported result exists',
      async (_name, features) => {
        provider(features);
        render(<AddressSearch locale={locale} />);
        submit();
        await screen.findByText(
          locale === 'ja'
            ? /日本の検索結果がありません/
            : /No supported Japan results/,
        );
        expect(selected).toHaveLength(0);
      },
    );

    test.each([
      'network',
      'HTTP',
      'shape',
      'coordinates',
      'geometry',
      'country',
      'label',
      'boundary',
    ])('address %s failures are explained', async (failure) => {
      const fetch = provider([match('Tokyo')]);
      if (failure === 'network') fetch.mockRejectedValue(new Error('offline'));
      if (failure === 'HTTP') fetch.mockResolvedValue({ ok: false });
      if (failure === 'shape')
        fetch.mockResolvedValue({
          ok: true,
          json: async () => ({ unexpected: true }),
        });
      if (failure === 'coordinates') provider([match('Broken', null)]);
      if (failure === 'geometry')
        provider([
          {
            ...match('Broken'),
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ]);
      if (failure === 'country')
        provider([match('Broken', 139.6917, 35.6895, null)]);
      if (failure === 'label') provider([match('')]);
      if (failure === 'boundary')
        vi.spyOn(selection, 'isJapanLocation').mockRejectedValue(
          new Error('boundary unavailable'),
        );
      render(<AddressSearch locale={locale} />);
      submit();
      await screen.findByText(
        locale === 'ja'
          ? /住所を検索できませんでした/
          : /Address search failed/,
      );
      expect(selected).toHaveLength(0);
    });

    test('ambiguity stays explicit, capped suggestions explain the limit, and choosing restores input focus', async () => {
      provider(Array.from({ length: 10 }, (_, i) => match(`Place ${i}`)));
      render(<AddressSearch locale={locale} />);
      submit();
      await screen.findByText(
        locale === 'ja' ? /検索結果の一部/ : /Showing some matches/,
      );
      expect(selected).toHaveLength(0);
      expect(screen.getAllByRole('listitem')).toHaveLength(10);
      fireEvent.click(
        screen.getByRole('button', {
          name: locale === 'ja' ? 'Place 1を選択' : 'Select Place 1',
        }),
      );
      expect(selected).toHaveLength(1);
      act(() => window.dispatchEvent(new Event('gensai:selection-start')));
      expect(screen.queryByRole('list')).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole('searchbox'));
    });

    test.each([
      ['mainland', { position: [35.6895, 139.6917] }, null],
      ['island', { position: [24.467, 122.998] }, null],
      [
        'denied',
        { code: 1 },
        locale === 'ja' ? /許可されませんでした/ : /permission was denied/,
      ],
      [
        'unavailable',
        { code: 2 },
        locale === 'ja' ? /取得できませんでした/ : /location is unavailable/,
      ],
      ['timeout', { code: 3 }, locale === 'ja' ? /タイムアウト/ : /timed out/],
      [
        'overseas',
        { position: [37.5665, 126.978] },
        locale === 'ja' ? /日本の陸地ではありません/ : /outside land in Japan/,
      ],
      [
        'missing geolocation',
        { missing: true },
        locale === 'ja' ? /取得できませんでした/ : /location is unavailable/,
      ],
      [
        'boundary failure',
        { boundary: true, position: [35.6895, 139.6917] },
        locale === 'ja' ? /取得できませんでした/ : /location is unavailable/,
      ],
    ])(
      'device %s outcome emits a correctable selected location',
      async (_name, outcome, cause) => {
        provider();
        if (outcome.missing)
          Object.defineProperty(navigator, 'geolocation', {
            configurable: true,
            value: undefined,
          });
        if (outcome.boundary)
          vi.spyOn(selection, 'isJapanLocation').mockRejectedValue(
            new Error('boundary unavailable'),
          );
        render(<AddressSearch locale={locale} />);
        const input = screen.getByRole('searchbox');
        fireEvent.change(input, { target: { value: 'Editable address' } });
        const button = screen.getByRole('button', {
          name: locale === 'ja' ? '現在地を取得' : 'Use my location',
        });
        expect(requests).toHaveLength(0);
        fireEvent.click(button);
        if (!outcome.missing) {
          expect(button.getAttribute('aria-busy')).toBe('true');
          expect(requests[0].options).toEqual({
            maximumAge: 0,
            timeout: 10000,
            enableHighAccuracy: true,
          });
          await act(async () => {
            if (outcome.position)
              await requests[0].success({
                coords: {
                  latitude: outcome.position[0],
                  longitude: outcome.position[1],
                },
              });
            else requests[0].failure({ code: outcome.code });
          });
        }
        await waitFor(() => expect(selected).toHaveLength(1));
        expect(button.getAttribute('aria-busy')).toBe('false');
        expect(input.value).toBe('Editable address');
        expect(selected[0].location).toEqual(
          cause
            ? selection.TOKYO
            : { lat: outcome.position[0], lng: outcome.position[1] },
        );
        expect(selected[0].label).toMatch(
          cause
            ? /Tokyo fallback|東京への代替表示/
            : /device position|端末の現在地/,
        );
        if (cause) {
          expect(selected[0].explanation).toMatch(cause);
          expect(selected[0].explanation).toMatch(
            /not your detected current location|検出された現在地ではありません/,
          );
        } else expect(selected[0].explanation).toBe('');
        act(() => window.dispatchEvent(new Event('gensai:selection-start')));
        expect(screen.getByRole('searchbox').disabled).toBe(false);
      },
    );
  });
}

test.each(['', '   '])(
  'map readiness gates both controls and query %j preserves a pending device request',
  async (query) => {
    delete window.__gensaiMapInstance;
    const fetch = provider();
    render(<AddressSearch />);
    const input = screen.getByRole('searchbox');
    const device = screen.getByRole('button', { name: 'Use my location' });
    expect(input.disabled).toBe(true);
    expect(device.disabled).toBe(true);
    act(() => window.dispatchEvent(new Event('gensai:map-ready')));
    fireEvent.click(device);
    submit(query);
    expect(device.getAttribute('aria-busy')).toBe('true');
    expect(fetch).not.toHaveBeenCalled();
    await act(async () =>
      requests[0].success({
        coords: { latitude: 26.2124, longitude: 127.6809 },
      }),
    );
    expect(selected[0].location).toEqual({ lat: 26.2124, lng: 127.6809 });
  },
);

test('a newer query cancels the older response and selection attempts cancel late device callbacks', async () => {
  let release;
  const fetch = provider();
  fetch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  render(<AddressSearch />);
  submit('old');
  const signal = fetch.mock.calls[0][1].signal;
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'new' } });
  expect(signal.aborted).toBe(true);
  await act(async () =>
    release({
      ok: true,
      json: async () => ({
        type: 'FeatureCollection',
        features: [match('Old')],
      }),
    }),
  );
  expect(selected).toHaveLength(0);
  const device = screen.getByRole('button', { name: 'Use my location' });
  fireEvent.click(device);
  fireEvent.click(device);
  await act(async () =>
    requests[0].success({ coords: { latitude: 35.6895, longitude: 139.6917 } }),
  );
  expect(selected).toHaveLength(0);
  act(() => window.dispatchEvent(new Event('gensai:selection-start')));
  await act(async () =>
    requests[1].success({ coords: { latitude: 35.6895, longitude: 139.6917 } }),
  );
  expect(selected).toHaveLength(0);
});

test('composing Enter does not submit an unfinished Japanese input', () => {
  const fetch = provider();
  render(<AddressSearch locale="ja" />);
  const input = screen.getByRole('searchbox');
  fireEvent.change(input, { target: { value: '東京都' } });
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    isComposing: true,
    bubbles: true,
    cancelable: true,
  });
  fireEvent(input, event);
  expect(event.defaultPrevented).toBe(true);
  expect(fetch).not.toHaveBeenCalled();
});

test('provider labels preserve address details without duplicate or non-text fields', async () => {
  const feature = match('Tokyo');
  feature.properties = {
    countrycode: 'JP',
    name: 'Tokyo',
    city: 'Tokyo',
    street: 'Street',
    postcode: '123',
    housenumber: 2,
  };
  provider([feature]);
  render(<AddressSearch />);
  submit();
  await waitFor(() => expect(selected).toHaveLength(1));
  expect(selected[0].label).toBe('Selected location: Tokyo, Street, 123');
});

test('editing a query removes existing choices without selecting a place', async () => {
  provider([match('Tokyo'), match('Yonaguni', 122.998, 24.467)]);
  render(<AddressSearch />);
  submit();
  await screen.findByRole('button', { name: 'Select Tokyo' });
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'unfinished' },
  });
  expect(screen.queryByRole('list')).toBeNull();
  expect(selected).toHaveLength(0);
  expect(document.querySelector('#address-search-feedback').textContent).toBe(
    '',
  );
});

test('later device activations request fresh positions and ignore older callbacks', async () => {
  render(<AddressSearch />);
  const device = screen.getByRole('button', { name: 'Use my location' });
  fireEvent.click(device);
  await act(async () =>
    requests[0].success({ coords: { latitude: 35.6895, longitude: 139.6917 } }),
  );
  fireEvent.click(device);
  fireEvent.click(device);
  expect(requests).toHaveLength(3);
  expect(requests.every(({ options }) => options.maximumAge === 0)).toBe(true);
  await act(async () =>
    requests[1].success({ coords: { latitude: 26.2124, longitude: 127.6809 } }),
  );
  expect(selected).toHaveLength(1);
  await act(async () =>
    requests[2].success({ coords: { latitude: 24.467, longitude: 122.998 } }),
  );
  expect(selected).toHaveLength(2);
  expect(selected[1].location).toEqual({ lat: 24.467, lng: 122.998 });
  expect(device.getAttribute('aria-busy')).toBe('false');
});
