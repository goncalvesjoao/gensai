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
