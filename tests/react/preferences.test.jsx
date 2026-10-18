// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PreferenceControls from '../../src/components/PreferenceControls.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themeMode;
  document.documentElement.lang = 'en';
});

for (const blocked of [false, true]) {
  test(`selected modes cycle with ${blocked ? 'blocked' : 'available'} storage`, () => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.themeMode = 'system';
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    }));
    if (blocked)
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
    render(<PreferenceControls />);
    for (const [label, appearance, mode] of [
      ['Theme: System. Switch to light theme', 'light', 'light'],
      ['Theme: Light. Switch to dark theme', 'dark', 'dark'],
      ['Theme: Dark. Switch to system theme', 'dark', 'system'],
    ]) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(document.documentElement.dataset.theme).toBe(appearance);
      if (!blocked) expect(localStorage.getItem('gensai-theme')).toBe(mode);
    }
  });
}
