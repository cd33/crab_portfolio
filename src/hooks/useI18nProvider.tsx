import React, { useCallback, useState } from 'react';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import { I18nContext } from './I18nContext';

type Locale = 'fr' | 'en';
type Translations = typeof fr;
export interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Locale, Translations> = {
  fr,
  en,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale') as Locale | null;
    return saved && (saved === 'fr' || saved === 'en') ? saved : 'fr';
  });

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: Record<string, unknown> | string = translations[locale];
      for (const k of keys) {
        if (value && typeof value === 'object' && !Array.isArray(value) && k in value) {
          value = (value as Record<string, unknown>)[k] as Record<string, unknown> | string;
        } else {
          return key;
        }
      }
      if (typeof value !== 'string') return key;
      if (params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return paramKey in params ? String(params[paramKey]) : match;
        });
      }
      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
