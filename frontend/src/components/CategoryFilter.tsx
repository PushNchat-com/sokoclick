import React from 'react';
import { useTranslation } from 'react-i18next';

// Define the available categories
export const CATEGORIES = [
  { id: 'all', nameEn: 'All Categories', nameFr: 'Toutes les catégories', icon: '🏷️' },
  { id: 'electronics', nameEn: 'Electronics', nameFr: 'Électronique', icon: '📱' },
  { id: 'fashion', nameEn: 'Fashion', nameFr: 'Mode', icon: '👕' },
  { id: 'homegoods', nameEn: 'Home Goods', nameFr: 'Articles Ménagers', icon: '🏠' },
  { id: 'jewelry', nameEn: 'Jewelry', nameFr: 'Bijoux', icon: '💍' },
  { id: 'collectibles', nameEn: 'Collectibles', nameFr: 'Collections', icon: '🏆' },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onCategoryChange 
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{t('filterByCategory')}</h3>
      
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          const categoryName = currentLanguage === 'fr' ? category.nameFr : category.nameEn;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                flex items-center
                ${isSelected 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span className="mr-1">{category.icon}</span>
              <span>{categoryName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter; 