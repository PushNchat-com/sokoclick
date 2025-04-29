import React from "react";
import { useLanguage } from "@/store/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Slot } from "@/services/slots";
import {
  CheckIcon,
  XIcon,
  SettingsIcon,
  TrashIcon,
} from "@/components/ui/Icons";

interface SlotManagementBatchActionsProps {
  selectedCount: number;
  filterDraftStatus?: Slot["draft_status"];
  isBatchProcessing: boolean;
  onBatchApprove: () => void; // Placeholder for now
  onBatchReject: () => void; // Placeholder for now
  onBatchSetMaintenance: () => void;
  onBatchClearMaintenance: () => void;
  onBatchRemoveProduct: () => void;
  onClearSelection: () => void;
}

export const SlotManagementBatchActions: React.FC<
  SlotManagementBatchActionsProps
> = ({
  selectedCount,
  filterDraftStatus,
  isBatchProcessing,
  onBatchApprove,
  onBatchReject,
  onBatchSetMaintenance,
  onBatchClearMaintenance,
  onBatchRemoveProduct,
  onClearSelection,
}) => {
  const { t } = useLanguage();

  return (
    <div className="p-3 mb-4 bg-blue-50 rounded-lg border border-blue-200 transition-all shadow-sm">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3">
        <div className="mr-3 w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0">
          <span className="font-medium text-sm text-blue-800">
            {t({
              en: `${selectedCount} selected`,
              fr: `${selectedCount} sélectionnés`,
            })}
          </span>
        </div>

        <div className="flex flex-wrap justify-center sm:justify-start gap-2 flex-grow">
          {/* Show Approve/Reject only in approval mode */}
          {filterDraftStatus === "ready_to_publish" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onBatchApprove}
                disabled={isBatchProcessing}
                className="bg-white border-green-300 text-green-700 hover:bg-green-50"
              >
                <CheckIcon className="w-4 h-4 mr-1.5" />
                {t({ en: "Approve Selected", fr: "Approuver Sélection" })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onBatchReject}
                disabled={isBatchProcessing}
                className="bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <XIcon className="w-4 h-4 mr-1.5" />
                {t({ en: "Reject Selected", fr: "Rejeter Sélection" })}
              </Button>
            </>
          ) : (
            // Show standard batch actions otherwise
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onBatchSetMaintenance}
                disabled={isBatchProcessing}
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <SettingsIcon className="w-4 h-4 mr-1.5" />
                {t({ en: "Set Maint.", fr: "Maint. Activer" })}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onBatchClearMaintenance}
                disabled={isBatchProcessing}
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <CheckIcon className="w-4 h-4 mr-1.5" />
                {t({ en: "Clear Maint.", fr: "Maint. Terminer" })}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onBatchRemoveProduct}
                disabled={isBatchProcessing}
                className="bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 focus:ring-red-500"
              >
                <TrashIcon className="w-4 h-4 mr-1.5" />
                {t({ en: "Remove Products", fr: "Retirer Produits" })}
              </Button>
            </>
          )}
        </div>

        <div className="w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isBatchProcessing}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {t({ en: "Clear All", fr: "Tout Effacer" })}
          </Button>
        </div>
      </div>
    </div>
  );
};
