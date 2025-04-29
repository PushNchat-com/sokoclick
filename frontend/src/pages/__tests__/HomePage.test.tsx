import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../HomePage";
import { LanguageProvider } from "../../store/LanguageContext";
import { UnifiedAuthProvider } from "../../contexts/UnifiedAuthContext";

// Mock the hooks and components
vi.mock("../../services/slots", () => ({
  useSlots: () => ({
    slots: [
      {
        id: 1,
        position: 1,
        status: "occupied",
        is_active: true,
        product: {
          id: 1,
          name: "Test Product",
          price: 9.99,
          description: "Test description",
          status: "approved",
          created_at: new Date().toISOString(),
          category: { id: 1, name: "Electronics" },
        },
      },
      {
        id: 2,
        position: 2,
        status: "occupied",
        is_active: true,
        product: {
          id: 2,
          name: "Another Product",
          price: 19.99,
          description: "Another description",
          status: "approved",
          created_at: new Date().toISOString(),
          category: { id: 2, name: "Clothing" },
        },
      },
    ],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
  SlotStatus: { OCCUPIED: "occupied" },
}));

vi.mock("../../services/debugSlots", () => ({
  useDebugSlots: () => ({
    slots: [],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("../../services/categories", () => ({
  useCategories: () => ({
    categories: [
      { id: 1, name: "Electronics" },
      { id: 2, name: "Clothing" },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useSearchHistory", () => ({
  useSearchHistory: () => ({
    searchHistory: ["previous search"],
    addToHistory: vi.fn(),
    removeFromHistory: vi.fn(),
    clearHistory: vi.fn(),
  }),
}));

vi.mock("../../hooks/useSuggestions", () => ({
  useSuggestions: () => ({
    suggestions: ["suggestion 1", "suggestion 2"],
    loading: false,
  }),
}));

vi.mock("../../hooks/useConnectionMonitoring", () => ({
  useConnectionMonitoring: () => ({
    isOnline: true,
  }),
}));

vi.mock("../../components/seo/SeoComponent", () => ({
  default: () => <div data-testid="seo-component" />,
}));

vi.mock("../../utils/schemaMarkup", () => ({
  generateWebsiteSchema: () => ({}),
}));

vi.mock("../../utils/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Test suite
describe("HomePage Component", () => {
  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <LanguageProvider>
          <UnifiedAuthProvider>
            <HomePage />
          </UnifiedAuthProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders home page with products", async () => {
    renderHomePage();

    // Verify page renders
    expect(screen.getByText(/Welcome to SokoClick/i)).toBeInTheDocument();

    // Verify products are shown
    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeInTheDocument();
      expect(screen.getByText("Another Product")).toBeInTheDocument();
    });
  });

  test("search functionality works correctly", async () => {
    renderHomePage();

    // Find and interact with search input
    const searchInput = screen.getByPlaceholderText(/Search products/i);
    await userEvent.type(searchInput, "Test");

    // Submit search
    const searchButton = screen.getByRole("button", { name: /search/i });
    await userEvent.click(searchButton);

    // Verify search results
    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeInTheDocument();
      // Search should filter out non-matching products
      expect(screen.queryByText("Another Product")).not.toBeInTheDocument();
    });
  });

  test("category filtering works correctly", async () => {
    renderHomePage();

    // Find and click on category selector
    const categorySelector = screen.getByText(/All Categories/i);
    await userEvent.click(categorySelector);

    // Select a specific category
    const electronicsCategory = screen.getByText("Electronics");
    await userEvent.click(electronicsCategory);

    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeInTheDocument();
      expect(screen.queryByText("Another Product")).not.toBeInTheDocument();
    });
  });

  test("sorting functionality works correctly", async () => {
    renderHomePage();

    // Find and click on sorting selector
    const sortingSelector = screen.getByText(/Sort By/i);
    await userEvent.click(sortingSelector);

    // Select price low to high
    const priceLowOption = screen.getByText(/Price: Low to High/i);
    await userEvent.click(priceLowOption);

    // Verify sorting (first product should be the lower priced one)
    const productElements = screen.getAllByText(/Product/i);
    expect(productElements[0].textContent).toContain("Test Product");
  });

  test("accessibility features are present", () => {
    renderHomePage();

    // Skip link should be present
    const skipLink = screen.getByText(/Skip to content/i);
    expect(skipLink).toBeInTheDocument();

    // ARIA attributes should be present
    const searchInput = screen.getByPlaceholderText(/Search products/i);
    expect(searchInput).toHaveAttribute("aria-label");
  });

  test("performance monitoring for search interaction", async () => {
    // Mock performance measurement API
    const markSpy = vi.spyOn(performance, "mark");
    const measureSpy = vi.spyOn(performance, "measure");

    renderHomePage();

    // Perform search action
    const searchInput = screen.getByPlaceholderText(/Search products/i);
    await userEvent.type(searchInput, "performance test");

    const searchButton = screen.getByRole("button", { name: /search/i });
    await userEvent.click(searchButton);

    // Verify performance marks were called
    expect(markSpy).toHaveBeenCalledWith(
      expect.stringContaining("search-start"),
    );
    expect(measureSpy).toHaveBeenCalled();
  });
});
