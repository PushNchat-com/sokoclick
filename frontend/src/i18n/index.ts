import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// NOTE: This configuration uses a traditional i18next setup. For newer React applications,
// consider using the following modern practices:
// - Use React Suspense with i18next for better loading states
// - Consider createInstance API for more isolated i18n instances
// - Use resources directly for better bundling with code-splitting

// Initialize i18next
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    supportedLngs: ['en', 'fr'],
    backend: {
      // This path should match the structure in your public folder
      // Ensure files are correctly copied during build
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    // No need to explicitly set keySeparator to '.' as it's the default
    // keySeparator: '.',
    
    // React optimization - improves performance by reducing re-renders
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
    },
  });

export default i18n; 