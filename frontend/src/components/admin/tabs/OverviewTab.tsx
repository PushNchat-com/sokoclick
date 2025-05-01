import React, { FC } from "react";
import { Activity } from "../../../services/analytics";
import DashboardMetrics from "../DashboardMetrics";
// import ActivityFeed from "../ActivityFeed"; // Remove dead import
import { useLanguage, TranslationObject } from "@/store/LanguageContext"; // Import useLanguage
import { useAdminDashboardData } from "../../../hooks/useAdminDashboardData"; // Import hook type for prop types

// RecentActivities component using the Activity type from analytics service
interface RecentActivitiesProps {
  activities: Activity[];
}

const activityTranslations = {
  title: { en: "Recent Activity", fr: "Activité Récente" },
  noActivity: {
    en: "No recent activity found.",
    fr: "Aucune activité récente trouvée.",
  },
  // Titles/details now come from the Activity object itself
};

const RecentActivities: FC<RecentActivitiesProps> = ({ activities }) => {
  const { t } = useLanguage();

  if (!activities || activities.length === 0) {
    return <p>{t(activityTranslations.noActivity)}</p>;
  }

  return (
    <ul className="space-y-2">
      {activities.map((activity) => (
        <li key={activity.id} className="text-sm border-b border-gray-200 pb-1">
          <p className="font-medium text-gray-800">
            {t(activity.title)}
            <span className="text-xs text-gray-500 ml-2">
              ({new Date(activity.timestamp).toLocaleString()})
            </span>
          </p>
          <p className="text-gray-600">{t(activity.details)}</p>
          {/* Optionally display metadata if needed */}
          {/* {activity.metadata && (
            <pre className="text-xs text-gray-400 bg-gray-50 p-1 mt-1 overflow-x-auto">
              {JSON.stringify(activity.metadata, null, 2)}
            </pre>
          )} */}
        </li>
      ))}
    </ul>
  );
};

// Define props based on what AdminDashboard passes
interface OverviewTabProps {
  activities: Activity[];
  stats: ReturnType<typeof useAdminDashboardData>["stats"];
  metrics: ReturnType<typeof useAdminDashboardData>["metrics"];
  pendingApprovalsCount: number;
}

const OverviewTab: FC<OverviewTabProps> = ({
  activities,
  stats,
  metrics,
  pendingApprovalsCount,
}) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      {/* Pass stats and metrics down to DashboardMetrics */}
      <DashboardMetrics
        stats={stats}
        metrics={metrics}
        pendingApprovalsCount={pendingApprovalsCount}
      />
      {/* Activity Feed */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        {/* <ActivityFeed activities={activities} /> // Comment out usage */}
        {activities.length === 0 && (
          <p>{t(activityTranslations.noActivity)}</p>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
