import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PreferenceControls from '../../src/components/PreferenceControls.jsx';

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.lang = 'en';
});

for (const blocked of [false, true]) {
  test(`theme toggles from the resolved preference with ${blocked ? 'blocked' : 'available'} storage`, () => {
    document.documentElement.dataset.theme = blocked ? 'dark' : 'light';
    document.documentElement.lang = 'en';
    if (blocked)
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
    render(<PreferenceControls />);
    fireEvent.click(
      screen.getByRole('button', {
        name: blocked ? 'Switch to light theme' : 'Switch to dark theme',
      }),
    );
    expect(document.documentElement.dataset.theme).toBe(
      blocked ? 'light' : 'dark',
    );
    if (!blocked) expect(localStorage.getItem('gensai-theme')).toBe('dark');
    fireEvent.click(
      screen.getByRole('button', {
        name: blocked ? 'Switch to dark theme' : 'Switch to light theme',
      }),
    );
    expect(document.documentElement.dataset.theme).toBe(
      blocked ? 'dark' : 'light',
    );
  });
}
