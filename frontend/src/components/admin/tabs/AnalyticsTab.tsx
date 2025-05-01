import React, { FC, Suspense, useCallback } from "react";
import { lazyWithSpinner } from "../../../utils/lazyImport";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { useAdminDashboardData } from "../../../hooks/useAdminDashboardData"; // Import hook type for props
import { Button } from "../../ui/Button"; // Import Button
import { RefreshIcon } from "../../ui/Icons"; // Import Icon
import { useLanguage } from "../../../store/LanguageContext"; // Import useLanguage
import ConfirmDialogProvider from "@/components/ui/ConfirmDialog";

// Define a simple Date Range Picker (can be moved to ui components later)
// --- Simple Date Range Picker Start ---
interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  setDateRange: (start: Date, end: Date) => void;
}

const SimpleDateRangePicker: FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  setDateRange,
}) => {
  const { t } = useLanguage();
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(new Date(e.target.value), endDate);
  };
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(startDate, new Date(e.target.value));
  };

  // Format date to YYYY-MM-DD for input type=date
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md mb-4">
      <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
        {t({ en: "Start Date:", fr: "Date de début :" })}
      </label>
      <input
        type="date"
        id="startDate"
        value={formatDate(startDate)}
        onChange={handleStartDateChange}
        className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm p-1.5"
      />
      <label
        htmlFor="endDate"
        className="text-sm font-medium text-gray-700 ml-3"
      >
        {t({ en: "End Date:", fr: "Date de fin :" })}
      </label>
      <input
        type="date"
        id="endDate"
        value={formatDate(endDate)}
        onChange={handleEndDateChange}
        className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm p-1.5"
      />
    </div>
  );
};
// --- Simple Date Range Picker End ---

// Lazy load the main Analytics component
const AnalyticsComponent = lazyWithSpinner(
  () => import("../AnalyticsComponent"),
);

// Update props interface
interface AnalyticsTabProps {
  analyticsData: ReturnType<typeof useAdminDashboardData>["detailedAnalytics"];
  startDate: Date;
  endDate: Date;
  setDateRange: (start: Date, end: Date) => void;
  refreshAnalytics: () => void;
}

const AnalyticsTab: FC<AnalyticsTabProps> = ({
  analyticsData,
  startDate,
  endDate,
  setDateRange,
  refreshAnalytics,
}) => {
  const { t } = useLanguage(); // Get t function
  return (
    <ConfirmDialogProvider>
      <div className="space-y-6">
        <div className="space-y-4">
          {/* Date Range Picker */}
          <SimpleDateRangePicker
            startDate={startDate}
            endDate={endDate}
            setDateRange={setDateRange}
          />

          {/* Refresh Button */}
          <div className="text-right">
            <Button variant="outline" size="sm" onClick={refreshAnalytics}>
              <RefreshIcon className="w-4 h-4 mr-1.5" />
              {t({ en: "Refresh Analytics", fr: "Actualiser les Analyses" })}
            </Button>
          </div>

          {/* Render Analytics Component with data */}
          <Suspense fallback={<LoadingSpinner />}>
            <AnalyticsComponent analyticsData={analyticsData} />
          </Suspense>
        </div>
      </div>
    </ConfirmDialogProvider>
  );
};

export default AnalyticsTab;
