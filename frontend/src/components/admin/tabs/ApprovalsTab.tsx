import React, { FC } from "react";
import SlotManagement from "../SlotManagement";
import { useAdminDashboardData } from "../../../hooks/useAdminDashboardData"; // Import hook type

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
      {/* Render SlotManagement in approval mode */}
      {/* Pass filterDraftStatus and necessary refresh handlers */}
      <SlotManagement
        filterDraftStatus="ready_to_publish"
        refreshPendingCount={refreshPendingCount}
        refreshStats={refreshStats}
        stats={stats} // Pass stats down if SlotManagement needs it (e.g., for display)
        pendingApprovalsCount={pendingApprovalsCount} // Pass count down if needed
      />
    </div>
  );
};

export default ApprovalsTab;
