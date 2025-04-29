import React from "react";
import { useLanguage } from "../../store/LanguageContext";
import { SortCriteria } from "../../types/product";

interface SortingSelectorProps {
  value: SortCriteria;
  onChange: (value: SortCriteria) => void;
  className?: string;
}

const SortingSelector: React.FC<SortingSelectorProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const { language, t } = useLanguage();

  // Localized text for options
  const sortOptions = [
    {
      value: SortCriteria.NEWEST,
      label: {
        en: "Newest",
        fr: "Plus récent",
      },
    },
    {
      value: SortCriteria.ENDING_SOON,
      label: {
        en: "Ending Soon",
        fr: "Se termine bientôt",
      },
    },
    {
      value: SortCriteria.PRICE_DESC,
      label: {
        en: "Price: High to Low",
        fr: "Prix: Décroissant",
      },
    },
    {
      value: SortCriteria.PRICE_ASC,
      label: {
        en: "Price: Low to High",
        fr: "Prix: Croissant",
      },
    },
  ];

  return (
    <div className={`flex items-center ${className}`}>
      <label
        htmlFor="sort-selector"
        className="text-sm font-medium text-gray-700 mr-2"
      >
        {t({
          en: "Sort by",
          fr: "Trier par",
        })}
        :
      </label>
      <select
        id="sort-selector"
        value={value}
        onChange={(e) => onChange(e.target.value as SortCriteria)}
        className="block py-2 px-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label[language]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortingSelector;
