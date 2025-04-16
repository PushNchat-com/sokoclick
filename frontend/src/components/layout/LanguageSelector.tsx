import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentLanguage === 'en' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:text-gray-800'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('fr')}
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentLanguage === 'fr' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:text-gray-800'
        }`}
        aria-label="Switch to French"
      >
        FR
      </button>
    </div>
  );
};

export default LanguageSelector; 