/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { localeUrl } from '../lib/locale.mjs';
import { Moon, Sun, Languages } from 'lucide-react';
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
    light: 'Switch to light theme',
    dark: 'Switch to dark theme',
    locale: 'Choose language',
  },
  ja: {
    preferences: '表示設定',
    light: 'ライトテーマに切り替える',
    dark: 'ダークテーマに切り替える',
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
  const theme = preferences?.theme || 'light';
  const labels = translations[locale];

  useEffect(() => {
    // The layout resolves preferences before first paint; don't resolve them twice.
    const root = document.documentElement;
    setPreferences({
      theme: root.dataset.theme === 'dark' ? 'dark' : 'light',
      locale: root.lang === 'ja' ? 'ja' : 'en',
    });
  }, []);

  useEffect(() => {
    if (!preferences) return;
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.lang = preferences.locale;
  }, [preferences]);

  function selectLocale(locale) {
    if (locale === preferences?.locale) return;
    window.location.assign(localeUrl(window.location.href, locale));
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setPreferences({ theme: nextTheme, locale });
    savePreference('gensai-theme', nextTheme);
  }

  const themeLabel = theme === 'dark' ? labels.light : labels.dark;
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
            {theme === 'dark' ? (
              <Moon size={20} aria-hidden="true" />
            ) : (
              <Sun size={20} aria-hidden="true" />
            )}
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
