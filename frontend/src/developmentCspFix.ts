/**
 * Development-only CSP fix script
 *
 * This script modifies the Content Security Policy in development environments
 * to ensure that 'unsafe-eval' is enabled when needed.
 *
 * It must be imported first in main.tsx to run before other scripts.
 */

// Only run in development environment
if (
  process.env.NODE_ENV === "development" ||
  window.location.hostname === "localhost"
) {
  console.info("[DEV] Applying CSP fix for development environment");

  // Find and modify the CSP meta tag
  const cspMeta = document.querySelector(
    'meta[http-equiv="Content-Security-Policy"]',
  );

  if (cspMeta) {
    let cspContent = cspMeta.getAttribute("content") || "";

    // Check if unsafe-eval is already in the script-src directive
    if (
      !cspContent.includes("script-src") ||
      !cspContent.includes("'unsafe-eval'")
    ) {
      // If script-src exists but doesn't have unsafe-eval, add it
      if (cspContent.includes("script-src")) {
        cspContent = cspContent.replace(
          /script-src ([^;]+)/,
          "script-src $1 'unsafe-eval'",
        );
      }
      // If script-src doesn't exist, add it with unsafe-eval
      else {
        cspContent += "; script-src 'self' 'unsafe-inline' 'unsafe-eval'";
      }

      // Update the meta tag
      cspMeta.setAttribute("content", cspContent);
      console.info("[DEV] Added unsafe-eval to CSP for development");
    }
  } else {
    // No CSP meta tag found, create one
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content =
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: https://*.supabase.co";
    document.head.insertBefore(meta, document.head.firstChild);
    console.info("[DEV] Created CSP meta tag with unsafe-eval for development");
  }
}

export {};
