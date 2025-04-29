import React, { useState, useEffect } from "react";
import { checkAccessibility, initAxe, runA11yScan } from "../utils/a11y";
import { AxeResults } from "axe-core";

/**
 * A dev-only component for running accessibility checks
 * Only displays in development mode
 */
const AccessibilityDevTool: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<AxeResults | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize axe on mount
  useEffect(() => {
    const init = async () => {
      await initAxe();
      setIsInitialized(true);
    };

    if (process.env.NODE_ENV !== "production") {
      init();
    }
  }, []);

  // Run a scan on the current page
  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const scanResults = await runA11yScan();
      setResults(scanResults);
    } catch (error) {
      console.error("Error running accessibility scan:", error);
    } finally {
      setIsScanning(false);
    }
  };

  // Only render in development mode
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg overflow-hidden"
      style={{
        maxWidth: isExpanded ? "500px" : "50px",
        transition: "max-width 0.3s ease",
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        aria-label={
          isExpanded
            ? "Collapse accessibility panel"
            : "Expand accessibility panel"
        }
      >
        <span className="sr-only">Accessibility Tool</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v8"></path>
          <path d="M8 12h8"></path>
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Accessibility Checker</h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={handleRunScan}
              disabled={isScanning || !isInitialized}
              className={`w-full py-2 px-4 rounded-md text-white ${
                isScanning
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isScanning ? "Scanning..." : "Run Accessibility Scan"}
            </button>
          </div>

          {results && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-medium mb-2">Results:</h3>

              <div className="text-sm">
                <div
                  className={`p-2 mb-2 rounded ${
                    results.violations.length === 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {results.violations.length === 0
                    ? "✅ No accessibility issues detected"
                    : `🚨 Found ${results.violations.length} accessibility issues`}
                </div>

                {results.violations.length > 0 && (
                  <div className="max-h-80 overflow-y-auto">
                    {results.violations.map((violation, index) => (
                      <div
                        key={index}
                        className="mb-3 p-2 border border-gray-200 rounded"
                      >
                        <div className="font-medium">
                          {violation.impact && (
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded mr-2 ${getImpactClass(violation.impact)}`}
                            >
                              {violation.impact.toUpperCase()}
                            </span>
                          )}
                          {violation.help}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {violation.description}
                        </p>
                        <a
                          href={violation.helpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Learn more
                        </a>

                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer">
                              Affected elements ({violation.nodes.length})
                            </summary>
                            <ul className="pl-4 mt-2 list-disc">
                              {violation.nodes.map((node, nodeIndex) => (
                                <li key={nodeIndex} className="mb-2">
                                  <pre className="bg-gray-100 p-1 overflow-x-auto text-xs">
                                    {node.html}
                                  </pre>
                                  <details className="mt-1">
                                    <summary className="cursor-pointer">
                                      Fix suggestion
                                    </summary>
                                    <p className="whitespace-pre-line p-1">
                                      {node.failureSummary}
                                    </p>
                                  </details>
                                </li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get a class based on impact level
const getImpactClass = (impact: string): string => {
  switch (impact) {
    case "critical":
      return "bg-red-600 text-white";
    case "serious":
      return "bg-orange-600 text-white";
    case "moderate":
      return "bg-yellow-500 text-white";
    case "minor":
      return "bg-yellow-300 text-gray-800";
    default:
      return "bg-gray-500 text-white";
  }
};

export default AccessibilityDevTool;
