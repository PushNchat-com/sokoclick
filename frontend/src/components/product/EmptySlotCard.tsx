import React from 'react';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../../store/LanguageContext';

interface EmptySlotCardProps {
  slotNumber: number;
  isAdmin?: boolean;
  className?: string;
  onClick?: () => void;
}

const EmptySlotCard: React.FC<EmptySlotCardProps> = ({
  slotNumber,
  isAdmin = false,
  className = '',
  onClick,
}) => {
  const { t } = useLanguage();
  
  return (
    <div 
      className={twMerge(
        "empty-slot-card relative flex flex-col items-center justify-center",
        "rounded-card border border-dashed border-gray-300 bg-gray-50",
        "w-full md:w-card-md lg:w-card-lg h-[280px]",
        "text-center p-4 transition-colors shadow-sm",
        "md:m-3 lg:m-4",
        isAdmin ? "cursor-pointer hover:bg-gray-100 hover:border-gray-400" : "",
        className
      )}
      onClick={isAdmin ? onClick : undefined}
      data-slot={slotNumber}
    >
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-gray-300"></div>
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-gray-300"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-gray-300"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-gray-300"></div>
      
      <div className="text-4xl font-light text-gray-400 mb-2">{slotNumber}</div>
      <div className="text-sm font-medium text-gray-500 mb-1">
        {t({
          en: `Slot #${slotNumber}`,
          fr: `Emplacement #${slotNumber}`
        })}
      </div>
      <div className="text-sm font-medium text-primary-500 mb-4">
        {t({
          en: 'Available',
          fr: 'Disponible'
        })}
      </div>
      
      {isAdmin && (
        <button
          className="mt-2 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={t({
            en: 'Add Listing',
            fr: 'Ajouter une Annonce'
          })}
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t({
            en: 'Add Listing',
            fr: 'Ajouter une Annonce'
          })}
        </button>
      )}
    </div>
  );
};

export default EmptySlotCard;
