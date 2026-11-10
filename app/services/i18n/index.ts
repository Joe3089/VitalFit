import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

// Zod locales
import zodDe from 'zod-i18n-map/locales/de/zod.json';
import zodEn from 'zod-i18n-map/locales/en/zod.json';
import zodEs from 'zod-i18n-map/locales/es/zod.json';
import zodFr from 'zod-i18n-map/locales/fr/zod.json';
import zodIt from 'zod-i18n-map/locales/it/zod.json';
import zodPt from 'zod-i18n-map/locales/pt/zod.json';

// App locales
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import pt from './locales/pt.json';

const resources = {
  en: {
    ...en,
    zod: zodEn,
  },
  es: {
    ...es,
    zod: zodEs,
  },
  fr: {
    ...fr,
    zod: zodFr,
  },
  it: {
    ...it,
    zod: zodIt,
  },
  pt: {
    ...pt,
    zod: zodPt,
  },
  de: {
    ...de,
    zod: zodDe,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.getLocales()[0].languageCode || 'es',
  fallbackLng: 'es',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
});

// Set the error map explicitly to use the i18n instance we just created
z.setErrorMap((issue, ctx) => {
  return zodI18nMap(issue, ctx);
});

export default i18n;