import React from "react";
import { useLanguage } from "@/store/LanguageContext"; // Use alias path
import { Button } from "@/components/ui/Button"; // Use alias path
import { Input } from "@/components/ui/Input"; // Use alias path
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs"; // Use alias path
import {
  RefreshIcon,
  SearchIcon,
  FilterIcon,
  ChevronDownIcon,
} from "@/components/ui/Icons"; // Use alias path
import { Slot, useSlotStats, SlotStatus } from "@/services/slots"; // Remove SlotStats import attempt
import { getSlotStatusText } from "@/utils/slotUtils";

// Explicitly define the type for the stats object based on useSlotStats hook
interface SlotStatsData {
  total: number;
  available: number;
  live: number;
  maintenance: number;
}

interface SlotManagementToolbarProps {
  filterDraftStatus?: Slot["draft_status"];
  activeTab: string;
  onTabChange: (value: string) => void;
  stats: SlotStatsData | null; // Use the defined type, allow null initially
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

// Define status tabs
const statusTabs: (SlotStatus | "all")[] = [
  "all",
  SlotStatus.Empty,
  SlotStatus.Live,
  SlotStatus.Maintenance,
];

// Map SlotStatus enum values to the keys used in the stats object
const statusToStatsKeyMap: { [key in SlotStatus]?: keyof SlotStatsData } = {
  [SlotStatus.Empty]: "available", 
  [SlotStatus.Live]: "live",
  [SlotStatus.Maintenance]: "maintenance",
};

export const SlotManagementToolbar: React.FC<SlotManagementToolbarProps> = ({
  filterDraftStatus,
  activeTab,
  onTabChange,
  stats,
  searchTerm,
  onSearchChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onRefresh,
  isLoading,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Tab Navigation */} 
      {!filterDraftStatus && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {statusTabs.map((status) => {
              const isActive = activeTab === status;
              const statusText = status === 'all' ? { en: "All", fr: "Tous" } : getSlotStatusText(status);
              
              // Get count safely
              let count: number | undefined | null = null; // Default to null
              if (stats) { // Ensure stats is not null
                if (status === 'all') {
                  count = stats.total;
                } else {
                  const statsKey = statusToStatsKeyMap[status];
                  // Check if statsKey is a valid key of SlotStatsData
                  if (statsKey && statsKey in stats) {
                    count = stats[statsKey];
                  }
                }
              }

              return (
                <button
                  key={status}
                  onClick={() => onTabChange(status)}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out ${
                    isActive
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {t(statusText)}
                  {typeof count === 'number' && count >= 0 && (
                    <span
                      className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                        isActive
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative w-full sm:w-auto">
          <Input
            type="text"
            placeholder={
              filterDraftStatus
                ? t({
                    en: "Search approvals...",
                    fr: "Rechercher approbations...",
                  })
                : t({
                    en: "Search slots...",
                    fr: "Rechercher des emplacements...",
                  })
            }
            value={searchTerm}
            onChange={onSearchChange}
            className="pl-8 w-full"
          />
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Hide advanced filters in approval mode */}
        {!filterDraftStatus && (
          <Button
            variant="outline"
            size="sm"
            className="ml-0 sm:ml-2 whitespace-nowrap w-full sm:w-auto"
            onClick={onToggleAdvancedFilters}
          >
            <FilterIcon className="w-4 h-4 mr-1" />
            {showAdvancedFilters
              ? t({
                  en: "Hide Filters",
                  fr: "Masquer les filtres",
                })
              : t({
                  en: "More Filters",
                  fr: "Plus de filtres",
                })}
            <ChevronDownIcon
              className={`w-4 h-4 ml-1 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
            />
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="ml-0 sm:ml-2 w-full sm:w-auto"
          onClick={onRefresh}
          disabled={isLoading} // Use combined loading state
        >
          <RefreshIcon
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
          />
          <span className="sr-only">
            {t({
              en: "Refresh",
              fr: "Actualiser",
            })}
          </span>
        </Button>
      </div>
    </div>
  );
};
