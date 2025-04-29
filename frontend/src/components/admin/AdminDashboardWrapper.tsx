import React, { useState, useEffect } from "react";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { UserRole } from "../../types/auth";

interface AdminDashboardWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for the admin dashboard that handles authentication issues
 * and provides development fallbacks for CSP-related problems
 */
const AdminDashboardWrapper: React.FC<AdminDashboardWrapperProps> = ({
  children,
}) => {
  const { user, isAdmin, loading } = useUnifiedAuth();
  const [showDevBypass, setShowDevBypass] = useState<boolean>(false);
  const [bypassActive, setBypassActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isDev =
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost";

  // Listen for React errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (isDev && event.error) {
        const errorMsg = event.error.toString();
        setErrorMessage(errorMsg);

        if (
          errorMsg.includes("is not defined") ||
          errorMsg.includes("is not a function") ||
          errorMsg.includes("cannot read property") ||
          errorMsg.includes("CSP")
        ) {
          // Show bypass for specific types of errors
          setShowDevBypass(true);
        }
      }
    };

    // Add error event listener
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, [isDev]);

  // Detect if we're stuck in a loading state
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (loading && isDev) {
      timer = setTimeout(() => {
        setShowDevBypass(true);
      }, 8000); // Show bypass option after 8 seconds of loading
    }

    return () => clearTimeout(timer);
  }, [loading, isDev]);

  // If we're in production and not admin, don't render children
  if (!isDev && !isAdmin && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="mb-4">
            You do not have permission to access the admin dashboard.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  // If the user has activated the dev bypass
  if (isDev && bypassActive) {
    return (
      <div className="relative">
        <div className="sticky top-0 left-0 right-0 bg-yellow-100 text-yellow-800 px-4 py-2 flex justify-between items-center z-50">
          <span className="font-bold">
            ⚠️ DEVELOPMENT MODE: Authentication bypassed
          </span>
          <button
            onClick={() => setBypassActive(false)}
            className="px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-sm"
          >
            Disable Bypass
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Show the loading state or children
  return (
    <div className="relative">
      {showDevBypass && isDev && !bypassActive && (
        <div className="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-red-200">
          <h3 className="font-bold text-red-600 mb-2">
            Development Issue Detected
          </h3>
          {errorMessage && (
            <div className="mb-3 p-2 bg-gray-100 text-xs font-mono overflow-auto max-h-24">
              {errorMessage}
            </div>
          )}
          <p className="text-sm mb-3">
            {errorMessage
              ? "An error was detected in the application."
              : "Authentication appears to be stuck. This might be due to Content Security Policy restrictions."}
          </p>
          <button
            onClick={() => setBypassActive(true)}
            className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 rounded text-sm border border-yellow-300"
          >
            Bypass Issues (Dev Only)
          </button>
        </div>
      )}

      {loading && !bypassActive ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-lg font-medium text-gray-700">
            Verifying admin access...
          </h2>
          {isDev && (
            <p className="mt-2 text-sm text-gray-500">
              If this takes too long, check your console for warnings.
            </p>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default AdminDashboardWrapper;
