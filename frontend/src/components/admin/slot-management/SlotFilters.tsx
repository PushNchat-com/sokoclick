import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../../store/LanguageContext';
import { SlotStatus } from '../../../services/slots';
import { Button } from '../../ui/Button';
import { SearchIcon } from '../../ui/Icons';

interface SlotFiltersProps {
  /**
   * Current filter status
   */
  filterStatus: SlotStatus | 'all';
  
  /**
   * Current search term
   */
  searchTerm: string;
  
  /**
   * Callback when filter status changes
   */
  onFilterChange: (status: SlotStatus | 'all') => void;
  
  /**
   * Callback when search term changes
   */
  onSearchChange: (term: string) => void;
}

/**
 * Component for filtering slots by status and search term
 */
const SlotFilters: React.FC<SlotFiltersProps> = ({
  filterStatus,
  searchTerm,
  onFilterChange,
  onSearchChange
}) => {
  const { t } = useLanguage();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // Reset local search term when searchTerm prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);
  
  // Debounce search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        onSearchChange(localSearchTerm);
      }
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [localSearchTerm, searchTerm, onSearchChange]);
  
  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  }, []);
  
  // Text content
  const filterLabels = {
    all: { en: 'All', fr: 'Tous' },
    [SlotStatus.AVAILABLE]: { en: 'Available', fr: 'Disponible' },
    [SlotStatus.OCCUPIED]: { en: 'Occupied', fr: 'Occupé' },
    [SlotStatus.RESERVED]: { en: 'Reserved', fr: 'Réservé' },
    [SlotStatus.MAINTENANCE]: { en: 'Maintenance', fr: 'Maintenance' }
  };
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Status filter buttons */}
      <div className="inline-flex items-center rounded-md shadow-sm" role="group">
        {(['all', SlotStatus.AVAILABLE, SlotStatus.OCCUPIED, SlotStatus.RESERVED, SlotStatus.MAINTENANCE] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'primary' : 'outline'}
            size="sm"
            className={`${
              status === 'all' ? 'rounded-l-md' : ''
            } ${
              status === SlotStatus.MAINTENANCE ? 'rounded-r-md' : ''
            } ${
              !(status === 'all' || status === SlotStatus.MAINTENANCE) ? 'rounded-none' : ''
            }`}
            onClick={() => onFilterChange(status)}
          >
            {t(filterLabels[status])}
          </Button>
        ))}
      </div>
      
      {/* Search input */}
      <div className="relative w-full sm:w-auto sm:min-w-64">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon className="w-4 h-4 text-gray-500" />
        </div>
        <input
          type="search"
          value={localSearchTerm}
          onChange={handleSearchChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2"
          placeholder={t({ en: 'Search slots...', fr: 'Rechercher des emplacements...' })}
        />
      </div>
    </div>
  );
};

export default SlotFilters; 