import React from "react";
import { useLanguage } from "@/store/LanguageContext"; // Use alias path
import { Button } from "@/components/ui/Button"; // Use alias path
import { Input } from "@/components/ui/Input"; // Use alias path

interface SlotManagementAdvancedFiltersProps {
  dateFilter: string;
  onDateFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterByUser: string;
  onFilterByUserChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFilters: () => void;
}

export const SlotManagementAdvancedFilters: React.FC<
  SlotManagementAdvancedFiltersProps
> = ({
  dateFilter,
  onDateFilterChange,
  filterByUser,
  onFilterByUserChange,
  onClearFilters,
}) => {
  const { t } = useLanguage();

  return (
    <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200 transition-all">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t({
              en: "Date Range",
              fr: "Période",
            })}
          </label>
          <Input
            type="date"
            value={dateFilter}
            onChange={onDateFilterChange}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t({
              en: "Filter by Seller",
              fr: "Filtrer par vendeur",
            })}
          </label>
          <Input
            type="text"
            value={filterByUser}
            onChange={onFilterByUserChange}
            placeholder={t({
              en: "Seller name or ID",
              fr: "Nom ou ID du vendeur",
            })}
            className="w-full"
          />
        </div>
        <div className="flex-grow"></div>
        <Button variant="outline" className="mb-1" onClick={onClearFilters}>
          {t({
            en: "Clear Filters",
            fr: "Effacer les filtres",
          })}
        </Button>
      </div>
    </div>
  );
};
