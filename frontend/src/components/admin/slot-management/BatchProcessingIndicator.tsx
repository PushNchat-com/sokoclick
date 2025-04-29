import React from "react";
import { useLanguage } from "@/store/LanguageContext";

interface BatchProcessingIndicatorProps {
  batchProgress: {
    total: number;
    completed: number;
    success: number;
    failed: number;
  };
}

export const BatchProcessingIndicator: React.FC<
  BatchProcessingIndicatorProps
> = ({ batchProgress }) => {
  const { t } = useLanguage();

  if (batchProgress.total === 0) return null; // Don't render if total is 0

  const progressPercentage =
    (batchProgress.completed / batchProgress.total) * 100;

  return (
    <div className="p-3 mb-4 bg-gray-50 rounded-lg border border-gray-200 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {t({
            en: `Processing batch operation...`,
            fr: `Traitement par lot en cours...`,
          })}
        </span>
        <span className="text-xs text-gray-500">
          {`${batchProgress.completed}/${batchProgress.total}`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
        <div
          className="bg-blue-600 h-1.5 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-xs mt-1 text-right text-gray-600">
        {batchProgress.success > 0 && (
          <span className="text-green-600 mr-2">
            ✓ {batchProgress.success} {t({ en: "succeeded", fr: "réussis" })}
          </span>
        )}
        {batchProgress.failed > 0 && (
          <span className="text-red-600">
            ✗ {batchProgress.failed} {t({ en: "failed", fr: "échoués" })}
          </span>
        )}
      </div>
    </div>
  );
};
