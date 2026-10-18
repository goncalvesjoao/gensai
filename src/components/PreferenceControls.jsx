/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { localeUrl } from '../lib/locale.mjs';
import { Moon, Sun, SunMoon, Languages } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from './ui/dropdown-menu';

const locales = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
];

const translations = {
  en: {
    preferences: 'Display preferences',
    light: 'Theme: Light. Switch to dark theme',
    dark: 'Theme: Dark. Switch to system theme',
    system: 'Theme: System. Switch to light theme',
    locale: 'Choose language',
  },
  ja: {
    preferences: '表示設定',
    light: 'テーマ：ライト。ダークテーマに切り替える',
    dark: 'テーマ：ダーク。システム設定に切り替える',
    system: 'テーマ：システム。ライトテーマに切り替える',
    locale: '言語を選択',
  },
};

function ControlTooltip({ label, children }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="bottom" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences still work when storage is unavailable.
  }
}

export default function PreferenceControls({ locale = 'en' }) {
  const [preferences, setPreferences] = useState(null);
  const theme = preferences?.theme || 'system';
  const labels = translations[locale];

  useEffect(() => {
    // The layout resolves preferences before first paint; don't resolve them twice.
    const root = document.documentElement;
    setPreferences({
      theme: root.dataset.themeMode || 'system',
      locale: root.lang === 'ja' ? 'ja' : 'en',
    });
  }, []);

  useEffect(() => {
    if (!preferences) return;
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function applyTheme() {
      root.dataset.themeMode = preferences.theme;
      root.dataset.theme =
        preferences.theme === 'system'
          ? media.matches
            ? 'dark'
            : 'light'
          : preferences.theme;
    }
    applyTheme();
    root.lang = preferences.locale;
    if (preferences.theme !== 'system') return;
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [preferences]);

  function selectLocale(locale) {
    if (locale === preferences?.locale) return;
    window.location.assign(localeUrl(window.location.href, locale));
  }

  function toggleTheme() {
    const nextTheme = { light: 'dark', dark: 'system', system: 'light' }[theme];
    setPreferences({ theme: nextTheme, locale });
    savePreference('gensai-theme', nextTheme);
  }

  const themeLabel = labels[theme];
  const ThemeIcon = { light: Sun, dark: Moon, system: SunMoon }[theme];
  return (
    <TooltipProvider>
      <div
        className="flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm"
        role="group"
        aria-label={labels.preferences}
      >
        <ControlTooltip label={themeLabel}>
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-muted-foreground"
            id="theme-toggle"
            type="button"
            aria-label={themeLabel}
            disabled={!preferences}
            onClick={toggleTheme}
          >
            <ThemeIcon size={20} aria-hidden="true" />
          </Button>
        </ControlTooltip>
        <DropdownMenu>
          <ControlTooltip label={labels.locale}>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="text-muted-foreground"
                />
              }
              id="locale-toggle"
              aria-label={labels.locale}
              disabled={!preferences}
            >
              <Languages size={20} aria-hidden="true" />
            </DropdownMenuTrigger>
          </ControlTooltip>
          <DropdownMenuContent
            side="bottom"
            align="end"
            sideOffset={8}
            className="min-w-40"
            aria-label={labels.locale}
          >
            <DropdownMenuRadioGroup value={locale} onValueChange={selectLocale}>
              {locales.map(({ value, label }) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
