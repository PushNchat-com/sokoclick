/**
 * Table Overflow Detector - Adds visual indicators to horizontally scrollable tables
 *
 * This utility detects when tables have horizontal overflow and adds appropriate
 * classes to show visual indicators (shadows) that help users understand the table
 * can be scrolled horizontally.
 *
 * Especially useful for responsive tables on tablet devices (600-900px width).
 */

/**
 * Initializes the table overflow detection
 * @param {string} selector - CSS selector for table containers to monitor
 */
export function initTableOverflowDetection(
  selector = ".table-scroll-container",
) {
  if (typeof window === "undefined") return; // Guard for SSR

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      setupOverflowDetection(selector),
    );
  } else {
    setupOverflowDetection(selector);
  }

  // Also set up a mutation observer to detect dynamically added tables
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        const tables = document.querySelectorAll(selector);
        if (tables.length > 0) {
          tables.forEach((table) => {
            if (table instanceof HTMLElement) {
              setupTableObserver(table);
            }
          });
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Sets up overflow detection for all matching table containers
 */
function setupOverflowDetection(selector: string) {
  const tables = document.querySelectorAll(selector);
  tables.forEach((table) => {
    if (table instanceof HTMLElement) {
      setupTableObserver(table);
    }
  });

  // Check on window resize
  window.addEventListener("resize", () => {
    tables.forEach((table) => {
      if (table instanceof HTMLElement) {
        checkTableOverflow(table);
      }
    });
  });
}

/**
 * Sets up observers for an individual table element
 */
function setupTableObserver(table: HTMLElement) {
  // Check initial state
  checkTableOverflow(table);

  // Add scroll event listener
  table.addEventListener("scroll", () => {
    if (table.scrollLeft + table.clientWidth >= table.scrollWidth - 10) {
      table.classList.remove("has-overflow-right");
    } else {
      table.classList.add("has-overflow-right");
    }

    if (table.scrollLeft <= 10) {
      table.classList.remove("has-overflow-left");
    } else {
      table.classList.add("has-overflow-left");
    }
  });
}

/**
 * Checks if a table has horizontal overflow and adds appropriate classes
 */
function checkTableOverflow(table: HTMLElement) {
  if (table.scrollWidth > table.clientWidth) {
    table.classList.add("has-overflow");

    // Check for right overflow
    if (table.scrollLeft + table.clientWidth < table.scrollWidth) {
      table.classList.add("has-overflow-right");
    } else {
      table.classList.remove("has-overflow-right");
    }

    // Check for left overflow
    if (table.scrollLeft > 0) {
      table.classList.add("has-overflow-left");
    } else {
      table.classList.remove("has-overflow-left");
    }
  } else {
    table.classList.remove(
      "has-overflow",
      "has-overflow-right",
      "has-overflow-left",
    );
  }
}
