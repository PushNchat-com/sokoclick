import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";

interface MigrationIssue {
  table: string;
  error: string;
  possibleFix: string;
}

const UserMigrationHelper: React.FC = () => {
  const [issues, setIssues] = useState<MigrationIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    async function checkDatabaseSchema() {
      setLoading(true);
      const tablesToCheck = ["profiles", "users", "auth_users", "admin_users"];
      const detectedIssues: MigrationIssue[] = [];

      for (const table of tablesToCheck) {
        try {
          const { error } = await supabase
            .from(table)
            .select("count(*)", { count: "exact", head: true });

          if (error && error.message.includes("does not exist")) {
            let fix = "";
            if (table === "profiles") {
              fix =
                "Run the migration script that creates the profiles table or modify the code to use the users table instead.";
            } else if (table === "admin_users") {
              fix =
                "Check for infinite recursion in RLS policies on admin_users table. Run the fix_admin_users_recursion.sql migration.";
            } else {
              fix = `Create the ${table} table according to the schema design or modify the code to use an existing table.`;
            }

            detectedIssues.push({
              table,
              error: error.message,
              possibleFix: fix,
            });
          }
        } catch (err) {
          console.error(`Error checking table ${table}:`, err);
        }
      }

      setIssues(detectedIssues);
      setLoading(false);
    }

    checkDatabaseSchema();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-md">
        Checking database schema...
      </div>
    );
  }

  if (issues.length === 0) {
    return null; // Don't show anything if no issues
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-md mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-yellow-800">
          Database Schema Issues Detected ({issues.length})
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {showDetails && (
        <div className="mt-3">
          <p className="text-sm text-yellow-700 mb-3">
            The following database issues were detected. These might cause
            errors in the application.
          </p>

          <ul className="space-y-2">
            {issues.map((issue, index) => (
              <li
                key={index}
                className="bg-white p-3 rounded-md border border-yellow-200"
              >
                <p className="font-medium text-red-600">Table: {issue.table}</p>
                <p className="text-sm text-gray-700">Error: {issue.error}</p>
                <p className="text-sm text-green-700 mt-1">
                  Possible fix: {issue.possibleFix}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>For Administrators:</strong> Run the appropriate migration
              scripts in the /supabase/migrations folder to fix these issues.
              For immediate workarounds, the application will attempt to use
              alternative tables.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMigrationHelper;
