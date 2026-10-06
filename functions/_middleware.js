export function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === 'gensai.help' && /^\/(ja\/?)?$/.test(url.pathname)) {
    url.pathname = url.pathname.startsWith('/ja')
      ? '/ja/welcome/'
      : '/welcome/';
    return next(new Request(url, request));
  }
  if (url.hostname === 'map.gensai.help' && url.pathname === '/ja') {
    url.pathname = '/ja/';
    return next(new Request(url, request));
  }
  return next();
}
