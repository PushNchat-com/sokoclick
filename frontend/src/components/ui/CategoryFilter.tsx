import React from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { Category } from '../../services/categories';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onChange?: (category: string | null) => void;
  className?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  onChange,
  className = ''
}) => {
  const { language, t } = useLanguage();

  const handleCategoryChange = (category: string | null) => {
    if (onChange) {
      onChange(category);
    } else {
      onCategoryChange(category);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 mr-2">
        {t({
          en: 'Category',
          fr: 'Catégorie'
        })}:
      </label>
      <select
        id="category-filter"
        value={selectedCategory || ''}
        onChange={(e) => handleCategoryChange(e.target.value || null)}
        className="block py-2 px-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      >
        <option value="">
          {t({
            en: 'All Categories',
            fr: 'Toutes les Catégories'
          })}
        </option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {language === 'en' ? category.name_en : category.name_fr}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter; 