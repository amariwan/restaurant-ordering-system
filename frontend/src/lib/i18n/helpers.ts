import type { Locale } from './config';

export function localizedValue<T extends Record<string, any>>(
  obj: T,
  field: string,
  locale: Locale,
): string {
  const key = locale === 'ku' ? `${field}Ku` : `${field}En`;
  return obj[key] ?? obj[`${field}En`] ?? '';
}
