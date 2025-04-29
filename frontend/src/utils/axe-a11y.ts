import React from "react";

/**
 * This function initializes axe-core for accessibility testing in development mode.
 * It only runs in development mode and has no effect in production.
 */
export function initializeA11yTesting() {
  if (process.env.NODE_ENV !== "production") {
    import("react-dom").then(async (ReactDOM) => {
      const axe = await import("@axe-core/react");
      const reactDom = ReactDOM.default || ReactDOM;

      axe.default(React, reactDom, 1000, {
        rules: [
          // Add custom rule configurations here if needed
        ],
      });

      console.log("Accessibility testing initialized with axe-core");
    });
  }
}

/**
 * Run an accessibility test on a specific element and output results to console
 * @param elementId The ID of the element to test
 */
export async function runA11yTest(elementId?: string) {
  if (process.env.NODE_ENV !== "production") {
    try {
      const axeCore = await import("axe-core");
      const element = elementId ? document.getElementById(elementId) : document;

      if (!element) {
        console.error(`Element with ID "${elementId}" not found`);
        return;
      }

      // Run the accessibility test
      const results = await axeCore.default.run(element);

      // Log the results
      if (results.violations.length === 0) {
        console.log(
          "%c✓ No accessibility violations detected",
          "color: green; font-weight: bold;",
        );
      } else {
        console.error(
          `%c❌ ${results.violations.length} accessibility violation(s) detected`,
          "color: red; font-weight: bold;",
        );

        results.violations.forEach((violation) => {
          const nodes = violation.nodes.map((node) => node.html).join("\n");
          console.group(
            `%c${violation.impact} impact: ${violation.help}`,
            "color: red;",
          );
          console.log(`Rule: ${violation.id}`);
          console.log(`Description: ${violation.description}`);
          console.log(`Help URL: ${violation.helpUrl}`);
          console.log("Affected nodes:");
          console.log(nodes);
          console.groupEnd();
        });
      }

      return results;
    } catch (error) {
      console.error("Error running accessibility test:", error);
    }
  }

  return null;
}
