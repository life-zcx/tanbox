export type SiteLanguage = 'ru' | 'kz' | 'en';
export const SITE_URL = 'https://tanbox.kz';

export function normalizePath(input: string): string {
  let path = input.split(/[?#]/, 1)[0] || '/';
  if (!path.startsWith('/')) path = '/' + path;
  path = path.replace(/\/{2,}/g, '/').replace(/\/index\.html?$/, '/').replace(/\/+$/, '') || '/';
  path = path.replace(/^\/(kz|en)\/blog(?=\/|$)/, '/$1/articles').replace(/^\/blog(?=\/|$)/, '/articles');
  path = path.replace(/\/(tariffs)$/, '/services').replace(/\/(payments?)$/, '/payment-procedure').replace(/\/cookies$/, '/cookie-policy');
  return path;
}

export function getRouteLanguage(pathname: string): SiteLanguage {
  return /^\/kz(?:\/|$)/.test(pathname) ? 'kz' : /^\/en(?:\/|$)/.test(pathname) ? 'en' : 'ru';
}

export function unlocalizedPath(pathname: string): string {
  return normalizePath(pathname).replace(/^\/(kz|en)(?=\/|$)/, '') || '/';
}

export function localizedPath(pathname: string, lang: SiteLanguage): string {
  const clean = unlocalizedPath(pathname);
  return lang === 'ru' ? clean : `/${lang}${clean === '/' ? '' : clean}`;
}

export function languageAlternates(pathname: string): Record<string, string> {
  return { ru: SITE_URL + localizedPath(pathname, 'ru'), kk: SITE_URL + localizedPath(pathname, 'kz'), en: SITE_URL + localizedPath(pathname, 'en'), 'x-default': SITE_URL + localizedPath(pathname, 'ru') };
}
