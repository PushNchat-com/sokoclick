import React from 'react';
import { useLanguage } from '../../../store/LanguageContext';
import { DeliveryOption } from '../../../types/delivery';

interface DeliveryOptionsSectionProps {
  deliveryOptions: DeliveryOption[];
  onChange: (deliveryOptions: DeliveryOption[]) => void;
  onOptionRemoved?: (index: number) => void;
  errors: Record<string, string>;
}

const DeliveryOptionsSection: React.FC<DeliveryOptionsSectionProps> = ({
  deliveryOptions,
  onChange,
  onOptionRemoved,
  errors
}) => {
  const { t } = useLanguage();
  
  // Text content
  const text = {
    deliveryInfo: { en: 'Delivery Information', fr: 'Informations de livraison' },
    deliveryNameEn: { en: 'Delivery Name (English)', fr: 'Nom de livraison (Anglais)' },
    deliveryNameFr: { en: 'Delivery Name (French)', fr: 'Nom de livraison (Français)' },
    deliveryAreas: { en: 'Delivery Areas', fr: 'Zones de livraison' },
    separateWithCommas: { en: 'Separate with commas', fr: 'Séparer par des virgules' },
    deliveryDays: { en: 'Estimated Delivery Days', fr: 'Jours de livraison estimés' },
    deliveryFee: { en: 'Delivery Fee', fr: 'Frais de livraison' },
    addDeliveryOption: { en: 'Add Delivery Option', fr: 'Ajouter une option de livraison' },
    removeOption: { en: 'Remove Option', fr: 'Supprimer cette option' },
    option: { en: 'Option', fr: 'Option' }
  };
  
  // Handle delivery option field changes
  const handleOptionChange = (index: number, field: keyof DeliveryOption, value: any) => {
    const newOptions = [...deliveryOptions];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value
    };
    
    onChange(newOptions);
  };
  
  // Handle delivery areas input (comma separated string to array)
  const handleAreasChange = (index: number, areasString: string) => {
    const areas = areasString.split(',').map(area => area.trim()).filter(area => area);
    handleOptionChange(index, 'areas', areas);
  };
  
  // Add a new delivery option
  const handleAddOption = () => {
    onChange([
      ...deliveryOptions,
      {
        name_en: '',
        name_fr: '',
        areas: [],
        estimated_days: 1,
        fee: 0
      }
    ]);
  };
  
  // Remove a delivery option
  const handleRemoveOption = (index: number) => {
    // Keep at least one delivery option
    if (deliveryOptions.length <= 1) return;
    
    const newOptions = [...deliveryOptions];
    newOptions.splice(index, 1);
    onChange(newOptions);
    
    // Call the onOptionRemoved callback if provided
    if (onOptionRemoved) {
      onOptionRemoved(index);
    }
  };
  
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xl font-medium text-gray-900 mb-6">{t(text.deliveryInfo)}</h3>
      
      <div className="space-y-6">
        {deliveryOptions.map((option, index) => (
          <div 
            key={index} 
            className="relative p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
          >
            {/* Option header with number and remove button */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-700">
                {t(text.option)} {index + 1}
              </h4>
              
              {deliveryOptions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="-ml-0.5 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t(text.removeOption)}
                </button>
              )}
            </div>
            
            {/* Option fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Delivery Name (English) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.deliveryNameEn)}
                </label>
                <input
                  type="text"
                  value={option.name_en}
                  onChange={(e) => handleOptionChange(index, 'name_en', e.target.value)}
                  placeholder={t({ en: 'e.g. Standard Delivery', fr: 'ex. Livraison Standard' })}
                  className={`bg-white border ${errors[`delivery_name_en_${index}`] ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                />
                {errors[`delivery_name_en_${index}`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`delivery_name_en_${index}`]}</p>
                )}
              </div>
              
              {/* Delivery Name (French) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.deliveryNameFr)}
                </label>
                <input
                  type="text"
                  value={option.name_fr}
                  onChange={(e) => handleOptionChange(index, 'name_fr', e.target.value)}
                  placeholder={t({ en: 'e.g. Livraison Standard', fr: 'ex. Livraison Standard' })}
                  className={`bg-white border ${errors[`delivery_name_fr_${index}`] ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                />
                {errors[`delivery_name_fr_${index}`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`delivery_name_fr_${index}`]}</p>
                )}
              </div>
              
              {/* Delivery Areas */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.deliveryAreas)} <span className="text-gray-500 text-xs">({t(text.separateWithCommas)})</span>
                </label>
                <input
                  type="text"
                  value={option.areas.join(', ')}
                  onChange={(e) => handleAreasChange(index, e.target.value)}
                  placeholder={t({ en: 'e.g. Douala, Yaoundé', fr: 'ex. Douala, Yaoundé' })}
                  className={`bg-white border ${errors[`delivery_areas_${index}`] ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                />
                {errors[`delivery_areas_${index}`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`delivery_areas_${index}`]}</p>
                )}
              </div>
              
              {/* Estimated Delivery Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.deliveryDays)}
                </label>
                <input
                  type="number"
                  min="1"
                  value={option.estimated_days}
                  onChange={(e) => handleOptionChange(index, 'estimated_days', parseInt(e.target.value) || 1)}
                  className={`bg-white border ${errors[`delivery_days_${index}`] ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                />
                {errors[`delivery_days_${index}`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`delivery_days_${index}`]}</p>
                )}
              </div>
              
              {/* Delivery Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.deliveryFee)}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">XAF</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={option.fee}
                    onChange={(e) => handleOptionChange(index, 'fee', parseFloat(e.target.value) || 0)}
                    className={`pl-16 bg-white border ${errors[`delivery_fee_${index}`] ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                  />
                </div>
                {errors[`delivery_fee_${index}`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`delivery_fee_${index}`]}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Add delivery option button */}
        <button
          type="button"
          onClick={handleAddOption}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t(text.addDeliveryOption)}
        </button>
      </div>
    </div>
  );
};

export default DeliveryOptionsSection; 