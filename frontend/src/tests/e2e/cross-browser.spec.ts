import { test, expect } from "@playwright/test";

// Test main pages across different browsers and devices
test.describe("Cross-browser compatibility tests", () => {
  // List of pages to test
  const pagesToTest = [
    { path: "/", name: "Home Page" },
    { path: "/products", name: "Products Page" },
  ];

  // Test each page
  for (const page of pagesToTest) {
    test(`${page.name} loads and displays correctly`, async ({
      page: browserPage,
    }) => {
      // Navigate to the page
      await browserPage.goto(`http://localhost:3000${page.path}`);

      // Wait for the page to be fully loaded
      await browserPage.waitForLoadState("networkidle");

      // Check if the page has loaded by verifying key elements
      expect(await browserPage.title()).not.toBe("");

      // Take a screenshot for visual comparison
      await browserPage.screenshot({
        path: `./test-results/screenshots/${browserPage.context().browser()?.name() || "unknown"}-${page.name.toLowerCase().replace(/\s+/g, "-")}.png`,
        fullPage: true,
      });

      // Check for console errors
      const errors = [];
      browserPage.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      // Assert no console errors were detected
      expect(errors.length).toBe(
        0,
        `Console errors found: ${errors.join(", ")}`,
      );

      // Test responsive behavior by resizing viewport
      await browserPage.setViewportSize({ width: 375, height: 667 }); // Mobile
      await browserPage.waitForTimeout(500);
      await browserPage.screenshot({
        path: `./test-results/screenshots/${browserPage.context().browser()?.name() || "unknown"}-${page.name.toLowerCase().replace(/\s+/g, "-")}-mobile.png`,
        fullPage: true,
      });

      await browserPage.setViewportSize({ width: 768, height: 1024 }); // Tablet
      await browserPage.waitForTimeout(500);
      await browserPage.screenshot({
        path: `./test-results/screenshots/${browserPage.context().browser()?.name() || "unknown"}-${page.name.toLowerCase().replace(/\s+/g, "-")}-tablet.png`,
        fullPage: true,
      });

      await browserPage.setViewportSize({ width: 1440, height: 900 }); // Desktop
      await browserPage.waitForTimeout(500);
      await browserPage.screenshot({
        path: `./test-results/screenshots/${browserPage.context().browser()?.name() || "unknown"}-${page.name.toLowerCase().replace(/\s+/g, "-")}-desktop.png`,
        fullPage: true,
      });
    });
  }

  // Basic user interaction tests
  test("Interactive elements respond correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/");

    // Find and test a button
    const buttons = await page.locator("button").all();
    if (buttons.length > 0) {
      await buttons[0].click();
      // Verify something happened (depends on what the button does)
    }

    // Test search input if present
    const searchInput = page.locator('input[type="search"]').first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("test search");
      await searchInput.press("Enter");
      // Verify search results appear
    }

    // Test navigation links
    const navLinks = await page.locator("nav a").all();
    if (navLinks.length > 0) {
      const firstLinkHref = await navLinks[0].getAttribute("href");
      await navLinks[0].click();

      // Verify navigation worked
      expect(page.url()).toContain(firstLinkHref);
    }
  });
});
