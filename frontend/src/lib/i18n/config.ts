export const LOCALES = ['en', 'ku'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ku: 'Kurdî',
};

export const LOCALE_DIRS: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ku: 'rtl',
};
