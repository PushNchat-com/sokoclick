import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../store/LanguageContext";
import { SlotStatus } from "../../../services/slots";
import { Button } from "../../ui/Button";
import { SearchIcon } from "../../ui/Icons";
import { getSlotStatusText } from "@/utils/slotUtils";

interface SlotFiltersProps {
  /**
   * Current filter status
   */
  filterStatus: SlotStatus | "all";

  /**
   * Current search term
   */
  searchTerm: string;

  /**
   * Callback when filter status changes
   */
  onFilterChange: (status: SlotStatus | "all") => void;

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
  onSearchChange,
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
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSearchTerm(e.target.value);
    },
    [],
  );

  // Use utility for status text
  const filterLabels = {
    all: { en: "All", fr: "Tous" },
    [SlotStatus.Empty]: getSlotStatusText(SlotStatus.Empty),
    [SlotStatus.Live]: getSlotStatusText(SlotStatus.Live),
    [SlotStatus.Maintenance]: getSlotStatusText(SlotStatus.Maintenance),
  };

  // Define the order of statuses for buttons
  const statusOrder: (SlotStatus | "all")[] = [
    "all",
    SlotStatus.Empty,
    SlotStatus.Live,
    SlotStatus.Maintenance,
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Status filter buttons */}
      <div
        className="inline-flex items-center rounded-md shadow-sm"
        role="group"
      >
        {statusOrder.map((status, index) => (
          <Button
            key={status}
            variant={filterStatus === status ? "primary" : "outline"}
            size="sm"
            className={`
              ${index === 0 ? "rounded-l-md" : ""}
              ${index === statusOrder.length - 1 ? "rounded-r-md" : ""}
              ${index > 0 && index < statusOrder.length - 1 ? "rounded-none -ml-px" : ""}
            `}
            onClick={() => onFilterChange(status)}
          >
            {t(filterLabels[status as keyof typeof filterLabels])}
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
          placeholder={t({
            en: "Search slots...",
            fr: "Rechercher des emplacements...",
          })}
        />
      </div>
    </div>
  );
};

export default SlotFilters;
