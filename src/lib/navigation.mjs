export function homeUrl(href, locale) {
  const url = new URL(href);
  const path = locale === 'ja' ? '/ja' : '/';
  if (url.hostname === 'map.localhost' || url.hostname === 'localhost')
    return `${url.protocol}//localhost${url.port ? `:${url.port}` : ''}${path}`;
  if (url.hostname === '127.0.0.1')
    return `${url.origin}${locale === 'ja' ? '/ja/welcome' : '/welcome'}`;
  return `https://gensai.help${path}`;
}
