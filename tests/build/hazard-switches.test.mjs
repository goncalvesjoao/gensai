// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';

// Execute the emitted controls and their actual script, rather than a copied handler.
afterEach(() => document.body.replaceChildren());
for (const locale of ['en', 'ja']) {
  test(`hazard controls emit every category combination (${locale})`, () => {
    const html = readFileSync(
      resolve(`dist/${locale === 'ja' ? 'ja/' : ''}index.html`),
      'utf8',
    );
    document.body.innerHTML = html;
    const controls = [...document.querySelectorAll('[data-hazard-category]')];
    expect(controls.map((input) => input.checked)).toEqual([
      true,
      false,
      false,
    ]);
    const script = [...document.querySelectorAll('script')].find((script) =>
      script.textContent.includes('gensai:hazards-change'),
    );
    expect(script).toBeTruthy();
    window.eval(script.textContent);
    const received = [];
    const receive = (event) => received.push(event.detail);
    document.addEventListener('gensai:hazards-change', receive);
    try {
      for (const bits of [0, 1, 3, 2, 6, 7, 5, 4]) {
        const expected = {
          tsunami: Boolean(bits & 1),
          flooding: Boolean(bits & 2),
          landslide: Boolean(bits & 4),
        };
        for (const input of controls) {
          const checked = expected[input.dataset.hazardCategory];
          if (input.checked !== checked) {
            input.checked = checked;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        expect(received.at(-1)).toEqual(expected);
        expect(controls.map((input) => input.checked)).toEqual(
          Object.values(expected),
        );
      }
    } finally {
      document.removeEventListener('gensai:hazards-change', receive);
    }
  });
}
