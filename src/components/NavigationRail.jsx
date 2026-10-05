/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { localeUrl } from '../lib/locale.mjs';
import { House, Backpack, LifeBuoy, Moon, Sun, Languages } from 'lucide-react';
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
    navigation: 'Main navigation',
    map: 'Gensai map',
    ready: 'Getting ready',
    help: 'Get help during a hazard',
    light: 'Switch to light theme',
    dark: 'Switch to dark theme',
    locale: 'Choose language',
  },
  ja: {
    navigation: 'メインナビゲーション',
    map: '防災マップ',
    ready: '災害への備え',
    help: '災害時の支援',
    light: 'ライトテーマに切り替える',
    dark: 'ダークテーマに切り替える',
    locale: '言語を選択',
  },
};

function RailTooltip({ label, children }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right" sideOffset={8}>
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

export default function NavigationRail({ path = '/', locale = 'en' }) {
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

  const links = [
    {
      href: '/',
      label: labels.map,
      icon: <House size={20} aria-hidden="true" />,
    },
    {
      href: '/getting-ready',
      label: labels.ready,
      icon: <Backpack size={20} aria-hidden="true" />,
    },
    {
      href: '/help',
      label: labels.help,
      icon: <LifeBuoy size={20} aria-hidden="true" />,
    },
  ];
  const themeLabel = theme === 'dark' ? labels.light : labels.dark;
  return (
    <TooltipProvider>
      <nav
        className="flex w-12 shrink-0 flex-col items-center gap-2 py-2"
        aria-label={labels.navigation}
      >
        {links.map(({ href, label, icon }) => (
          <RailTooltip key={href} label={label}>
            <Button
              variant="ghost"
              size="icon-lg"
              className="text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
              render={
                <a
                  href={
                    locale === 'ja' ? `/ja${href === '/' ? '' : href}` : href
                  }
                />
              }
              nativeButton={false}
              aria-label={label}
              aria-current={path === href ? 'page' : undefined}
            >
              {icon}
            </Button>
          </RailTooltip>
        ))}
        <div className="mt-auto grid gap-2">
          <RailTooltip label={themeLabel}>
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
          </RailTooltip>
          <DropdownMenu>
            <RailTooltip label={labels.locale}>
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
            </RailTooltip>
            <DropdownMenuContent
              side="right"
              align="end"
              sideOffset={8}
              className="min-w-40"
              aria-label={labels.locale}
            >
              <DropdownMenuRadioGroup
                value={locale}
                onValueChange={selectLocale}
              >
                {locales.map(({ value, label }) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </TooltipProvider>
  );
}
