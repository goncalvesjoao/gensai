export function localeFromPath(path) {
  return /^\/ja(?:\/|$)/.test(path) ? 'ja' : 'en';
}

export function unlocalizedPath(path) {
  return path.replace(/^\/ja(?:\/|$)/, '/') || '/';
}

export function localeUrl(href, locale) {
  if (locale !== 'en' && locale !== 'ja') {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  const url = new URL(href);
  const path = unlocalizedPath(url.pathname);
  url.pathname = locale === 'ja' ? `/ja${path === '/' ? '' : path}` : path;
  return url.href;
}
