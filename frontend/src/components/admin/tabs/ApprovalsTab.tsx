import React, { FC } from "react";
import SlotManagement from "../SlotManagement";
import { useAdminDashboardData } from "../../../hooks/useAdminDashboardData"; // Import hook type
import ConfirmDialogProvider from "../../../components/ui/ConfirmDialog"; // Import the provider
import { DraftStatus } from "@/utils/slotUtils"; // Corrected: Import from slotUtils
import { useSlotStats } from "@/services/slots";
import { useLanguage } from "@/store/LanguageContext";
import { Skeleton } from "@/components/ui/Skeleton";

// Update props interface to accept refresh handlers and potentially stats/count
interface ApprovalsTabProps {
  stats: ReturnType<typeof useAdminDashboardData>["stats"];
  pendingApprovalsCount: number;
  refreshPendingCount: () => void;
  refreshStats: () => void;
}

const ApprovalsTab: FC<ApprovalsTabProps> = ({
  stats,
  pendingApprovalsCount,
  refreshPendingCount,
  refreshStats,
}) => {
  return (
    <div>
      {/* Wrap SlotManagement with ConfirmDialogProvider to ensure context is available */}
      <ConfirmDialogProvider>
        <SlotManagement
          filterDraftStatus={"ready_to_publish"}
          refreshPendingCount={refreshPendingCount}
          refreshStats={refreshStats}
          stats={stats}
          pendingApprovalsCount={pendingApprovalsCount}
        />
      </ConfirmDialogProvider>
    </div>
  );
};

export default ApprovalsTab;
