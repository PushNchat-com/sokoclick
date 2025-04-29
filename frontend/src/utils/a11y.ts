import { AxeResults } from "axe-core";

/**
 * Utility for integrating axe-core accessibility testing in the application
 * This can be used in development mode to check accessibility issues in real-time
 */

// Define the expected shape of the global axe object
interface AxeCore {
  run: (context?: Element | Document, options?: any) => Promise<AxeResults>;
}

declare global {
  interface Window {
    axe?: AxeCore;
  }
}

/**
 * Initialize axe-core for accessibility testing in development
 */
export const initAxe = async (): Promise<void> => {
  if (process.env.NODE_ENV !== "production") {
    try {
      const axe = await import("axe-core");
      window.axe = axe.default;
      console.log("💯 axe-core initialized for a11y testing");
    } catch (error) {
      console.error("Failed to initialize axe-core:", error);
    }
  }
};

/**
 * Run an accessibility scan on the specified element or the entire document
 * @param element - The element to scan, defaults to document
 * @param options - Options for the axe scan
 * @returns Results of the accessibility scan
 */
export const runA11yScan = async (
  element: Element | Document = document,
  options: any = {},
): Promise<AxeResults | null> => {
  if (!window.axe) {
    console.warn("axe-core is not initialized. Call initAxe() first.");
    return null;
  }

  try {
    const results = await window.axe.run(element, options);
    return results;
  } catch (error) {
    console.error("Error running a11y scan:", error);
    return null;
  }
};

/**
 * Log accessibility issues to the console
 * @param results - The results from an axe scan
 */
export const logA11yIssues = (results: AxeResults | null): void => {
  if (!results) return;

  if (results.violations.length === 0) {
    console.log(
      "%c✅ No accessibility issues detected",
      "color: green; font-weight: bold;",
    );
    return;
  }

  console.groupCollapsed(
    `%c🔍 Accessibility issues: ${results.violations.length}`,
    "color: #E91E63; font-weight: bold;",
  );

  results.violations.forEach((violation) => {
    console.groupCollapsed(
      `%c${violation.impact?.toUpperCase() || "ISSUE"}: ${violation.help}`,
      `color: ${getColorByImpact(violation.impact)}; font-weight: bold;`,
    );

    console.log("Description:", violation.description);
    console.log("Help URL:", violation.helpUrl);
    console.log("Impact:", violation.impact);
    console.log("Tags:", violation.tags.join(", "));

    violation.nodes.forEach((node) => {
      console.groupCollapsed("Affected node");
      console.log("HTML:", node.html);
      console.log("Element:", node.target);
      console.log("Fix suggestions:", node.failureSummary);
      console.groupEnd();
    });

    console.groupEnd();
  });

  console.groupEnd();
};

/**
 * Get a color based on impact level for console styling
 */
const getColorByImpact = (impact: string | undefined): string => {
  switch (impact) {
    case "critical":
      return "#F44336";
    case "serious":
      return "#FF5722";
    case "moderate":
      return "#FF9800";
    case "minor":
      return "#FFC107";
    default:
      return "#607D8B";
  }
};

/**
 * Integration function to scan and log in one call
 * @param element - The element to scan, defaults to document
 */
export const checkAccessibility = async (
  element: Element | Document = document,
): Promise<void> => {
  if (process.env.NODE_ENV !== "production") {
    if (!window.axe) {
      await initAxe();
    }
    const results = await runA11yScan(element);
    logA11yIssues(results);
  }
};

export default {
  initAxe,
  runA11yScan,
  logA11yIssues,
  checkAccessibility,
};
