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
import { Slot, useSlotStats } from "@/services/slots"; // Use alias path

interface SlotManagementToolbarProps {
  filterDraftStatus?: Slot["draft_status"];
  activeTab: string;
  onTabChange: (value: string) => void;
  stats: ReturnType<typeof useSlotStats>["stats"]; // Use correct type
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onRefresh: () => void;
  isLoading: boolean; // Combined loading state from parent
}

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
    <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-center mb-4">
      {/* Hide tabs when in approval mode */}
      {!filterDraftStatus ? (
        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
          className="mr-4 mb-3 sm:mb-0 overflow-x-auto w-full sm:w-auto"
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-initial">
              {t({
                en: `All (${stats?.total || 0})`,
                fr: `Tous (${stats?.total || 0})`,
              })}
            </TabsTrigger>
            <TabsTrigger value="empty" className="flex-1 sm:flex-initial">
              {t({
                en: `Empty (${stats?.available || 0})`,
                fr: `Vides (${stats?.available || 0})`,
              })}
            </TabsTrigger>
            <TabsTrigger value="live" className="flex-1 sm:flex-initial">
              {t({
                en: `Live (${stats?.live || 0})`,
                fr: `En Ligne (${stats?.live || 0})`,
              })}
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex-1 sm:flex-initial">
              {t({
                en: `Maintenance (${stats?.maintenance || 0})`,
                fr: `Maintenance (${stats?.maintenance || 0})`,
              })}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : (
        // Placeholder or specific title for approval mode header
        <div className="text-sm font-medium text-gray-500 mb-3 sm:mb-0">
          {t({
            en: "Showing products ready for approval",
            fr: "Affichage des produits prêts pour approbation",
          })}
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
