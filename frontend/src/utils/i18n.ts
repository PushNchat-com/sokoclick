import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import dayjs from 'dayjs';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: Boolean(import.meta.env.DEV),
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ['en', 'fr'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

// Synchronize dayjs locale when i18n language changes
i18n.on('languageChanged', (lng) => {
  dayjs.locale(lng);
});

export default i18n; 