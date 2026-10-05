import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

test('entry point redirects to the map host without losing URL details or looping', () => {
  const scenarios = [
    ['https://gensai.help/', 'https://map.gensai.help/'],
    [
      'https://gensai.help/ja?hazard=tsunami#legend',
      'https://map.gensai.help/ja?hazard=tsunami#legend',
    ],
    ['http://gensai.help:8080/', 'https://map.gensai.help/'],
    ['http://localhost:4321/', 'http://map.localhost:4321/'],
    [
      'http://localhost:5000/ja/?hazard=flood#legend',
      'http://map.localhost:5000/ja/?hazard=flood#legend',
    ],
    ['http://localhost/', 'http://map.localhost/'],
    ['https://map.gensai.help/', undefined],
    ['https://map.gensai.help/ja', undefined],
    ['http://map.localhost:4321/', undefined],
    ['http://map.localhost:4321/ja', undefined],
    ['http://127.0.0.1:4321/', undefined],
    ['https://preview.example.com/', undefined],
    ['https://gensai.help.example.com/', undefined],
  ];
  for (const route of ['', 'ja/']) {
    const html = readFileSync(
      new URL(`../dist/${route}index.html`, import.meta.url),
      'utf8',
    );
    const head = html.slice(0, html.indexOf('</head>'));
    const redirect = [
      ...head.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g),
    ].find(([, script]) => script.includes('window.location.replace'))?.[1];
    assert.ok(redirect, 'Host redirect must run before the body renders');
    for (const [href, expected] of scenarios) {
      let destination;
      runInNewContext(redirect, {
        URL,
        window: {
          location: {
            href,
            replace: (url) => {
              destination = url;
            },
          },
        },
      });
      assert.equal(destination, expected, href);
    }
  }
});
