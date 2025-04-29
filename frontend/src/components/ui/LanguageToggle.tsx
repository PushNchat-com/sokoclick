import React from "react";
import { useLanguage } from "../../store/LanguageContext";
import { twMerge } from "tailwind-merge";

interface LanguageToggleProps {
  className?: string;
  compact?: boolean;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = "",
  compact = false,
}) => {
  const { language, toggleLanguage } = useLanguage();

  // Text for the languages
  const langText = {
    en: {
      en: "English",
      fr: "Anglais",
    },
    fr: {
      en: "French",
      fr: "Français",
    },
  };

  // Get current language name based on selected language
  const currentLang = langText[language][language];

  if (compact) {
    return (
      <button
        onClick={toggleLanguage}
        className={twMerge(
          "px-2 py-1 rounded-md text-sm font-medium transition-colors",
          "bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500",
          className,
        )}
        aria-label={
          language === "en" ? "Switch to French" : "Switch to English"
        }
      >
        {language === "en" ? "FR" : "EN"}
      </button>
    );
  }

  return (
    <div className={twMerge("flex items-center space-x-1", className)}>
      <button
        onClick={toggleLanguage}
        className={twMerge(
          "flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500",
        )}
        aria-label={
          language === "en" ? "Switch to French" : "Switch to English"
        }
      >
        <span className="mr-1">{language.toUpperCase()}</span>
        <span className="hidden sm:inline">({currentLang})</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 ml-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default LanguageToggle;
