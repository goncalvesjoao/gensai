import { scheduler } from 'node:timers/promises';
import assert from 'node:assert/strict';

export async function selectThemeMode(page, mode) {
  const document = page.locator('html');
  for (let attempts = 0; attempts < 3; attempts++) {
    if ((await document.getAttribute('data-theme-mode')) === mode) return;
    await page.locator('#theme-toggle').click();
  }
  assert.equal(
    await document.getAttribute('data-theme-mode'),
    mode,
    `Theme control did not select ${mode} after a complete cycle`,
  );
}

export async function waitForScaleChange(page, previousScale) {
  await page.waitForFunction(
    (previous) =>
      document.querySelector('.maplibregl-ctrl-scale')?.textContent !==
      previous,
    previousScale,
    { timeout: 10_000 },
  );
  assert.notEqual(
    await page.locator('.maplibregl-ctrl-scale').textContent(),
    previousScale,
  );
}

// The interval is a sampling cadence, not a readiness delay: completion depends
// on the asserted condition, and the deadline bounds missing observable state.
export async function waitForCondition(
  condition,
  description,
  timeout = 10_000,
) {
  const deadline = Date.now() + timeout;
  while (!(await condition())) {
    assert.ok(Date.now() < deadline, `Timed out waiting for ${description}`);
    await scheduler.wait(25);
  }
}

export async function waitForMarkerMovement(page) {
  await page.waitForFunction(
    () => {
      const marker = document
        .querySelector('.maplibregl-marker')
        ?.getBoundingClientRect();
      const canvas = document.querySelector('canvas')?.getBoundingClientRect();
      return (
        marker &&
        canvas &&
        Math.abs(marker.x + marker.width / 2 - (canvas.x + canvas.width / 2)) >
          2
      );
    },
    undefined,
    { timeout: 10_000 },
  );
}
