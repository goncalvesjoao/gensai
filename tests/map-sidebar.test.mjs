import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

for (const route of ['', 'ja/']) {
  const html = readFileSync(
    new URL(`../dist/${route}index.html`, import.meta.url),
    'utf8',
  );
  const script = [
    ...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g),
  ].find(([, script]) =>
    script.includes("document.getElementById('map-sidebar')"),
  )?.[1];
  assert.ok(script, `Sidebar script must ship on /${route}`);

  for (const mobile of [false, true]) {
    test(`sidebar controls and breakpoint changes /${route} (${mobile ? 'mobile' : 'desktop'})`, () => {
      const shell = { dataset: {} };
      const sidebar = {
        contains: () => true,
        addEventListener: (type, callback) => {
          sidebar[type] = callback;
        },
      };
      const buttons = Array.from({ length: 2 }, () => ({
        dataset: { openLabel: 'Open sidebar', closeLabel: 'Close sidebar' },
        setAttribute(key, value) {
          this[key] = value;
        },
        addEventListener(type, callback) {
          this[type] = callback;
        },
        focus() {
          this.focused = true;
        },
      }));
      shell.querySelectorAll = () => buttons;
      const media = {
        matches: mobile,
        addEventListener(type, callback) {
          this[type] = callback;
        },
      };
      runInNewContext(script, {
        document: { querySelector: () => shell, getElementById: () => sidebar },
        window: { matchMedia: () => media },
      });
      function check(open) {
        assert.equal(shell.dataset.sidebarOpen, String(open));
        assert.equal(sidebar.inert, !open);
        for (const button of buttons) {
          assert.equal(button['aria-expanded'], String(open));
          assert.equal(
            button['aria-label'],
            open ? 'Close sidebar' : 'Open sidebar',
          );
        }
      }
      check(!mobile);
      buttons[0].click();
      check(mobile);
      buttons[1].click();
      check(!mobile);
      media.change({ matches: true });
      check(false);
      buttons[1].click();
      check(true);
      buttons[0].focused = false;
      sidebar.keydown({ key: 'Escape' });
      check(false);
      assert.equal(buttons[0].focused, true);
      media.change({ matches: false });
      check(true);
    });
  }
}
