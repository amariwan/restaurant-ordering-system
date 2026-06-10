'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { type Locale, DEFAULT_LOCALE, LOCALES } from './config';
import type { Translations } from './messages/en';
import { en } from './messages/en';
import { ku } from './messages/ku';

const STORAGE_KEY = 'restaurant_locale';

const translations: Record<Locale, Translations> = { en, ku };

export function str(val: string | Record<string, string>): string {
  return typeof val === 'string' ? val : '';
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LOCALES.includes(stored as Locale)) return stored as Locale;
  const browserLang = navigator.language.split('-')[0];
  if (browserLang && LOCALES.includes(browserLang as Locale)) return browserLang as Locale;
  return DEFAULT_LOCALE;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  dir: 'ltr' | 'rtl';
  str: typeof str;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ku' ? 'rtl' : 'ltr';
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const dir = locale === 'ku' ? 'rtl' : 'ltr';
  const t = translations[locale];

  return (
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    <I18nContext.Provider value={{ locale, setLocale, t: t as Record<string, any>, str, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
