import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSession } from '../support/browser.mjs';

test('browser sessions share Chromium while isolating storage and closing contexts', async () => {
  const first = await browserSession();
  const second = await browserSession();
  try {
    const page = await first.newPage();
    const other = await second.newPage();
    assert.equal(page.context().browser(), other.context().browser());
    await page
      .context()
      .addCookies([{ name: 'test', value: 'first', url: 'http://localhost' }]);
    assert.equal((await other.context().cookies()).length, 0);
    await first.close();
    assert.equal(page.isClosed(), true);
    assert.equal(other.isClosed(), false);
  } finally {
    await first.close();
    await second.close();
  }
});
