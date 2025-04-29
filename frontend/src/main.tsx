// Import development CSP fix before anything else
import "./developmentCspFix";

import "./polyfills";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import React from "react";
// import "intersection-observer"; // Removed polyfill
// import "resize-observer-polyfill"; // Removed polyfill

// Initialize accessibility testing in development
async function initializeA11yTesting() {
  if (true) {
    // Changed condition temporarily based on previous error message
    // if (process.env.NODE_ENV === 'development') {
    try {
      const axe = await import("@axe-core/react");
      const ReactDOM = await import("react-dom");

      axe.default(React, ReactDOM, 1000);
      console.log("axe-core initialized for a11y testing");
    } catch (error) {
      console.error("Error initializing axe-core:", error);
    }
  }
}

// Initialize a11y testing in development
initializeA11yTesting();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
