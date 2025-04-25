import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define supported languages
export type Language = 'en' | 'fr';

// Define text translation object type
export type TranslationObject = {
  en: string;
  fr: string;
};

// Context interface
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (textObj: TranslationObject) => string;
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (textObj: TranslationObject) => textObj.en,
});

// Provider Props
interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

// Language Provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  defaultLanguage = 'en' 
}) => {
  // Get language from localStorage or use default
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      return savedLanguage || defaultLanguage;
    }
    return defaultLanguage;
  });
  
  // Set language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };
  
  // Add toggle language function
  const toggleLanguage = () => {
    const newLanguage: Language = language === 'en' ? 'fr' : 'en';
    setLanguage(newLanguage);
  };
  
  // Translation function
  const t = (textObj: TranslationObject): string => {
    if (!textObj) return '';
    return textObj[language] || textObj.en || '';
  };
  
  // Update document lang attribute when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);
  
  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext; 