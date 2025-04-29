import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  memo,
  useRef,
} from "react";
import { useLanguage } from "../store/LanguageContext";
import { useUnifiedAuth } from "../contexts/UnifiedAuthContext";
import ProductCard from "../components/product/ProductCard";
import SortingSelector from "../components/ui/SortingSelector";
import CategoryFilter from "../components/ui/CategoryFilter";
import LanguageToggle from "../components/ui/LanguageToggle";
import Skeleton from "../components/ui/Skeleton";
import { SortCriteria } from "../types/product";
import { useCategories } from "../services/categories";
import { useSlots, Slot } from "../services/slots";
import { useDebugSlots } from "../services/debugSlots";
import SeoComponent from "../components/seo/SeoComponent";
import { generateWebsiteSchema } from "../utils/schemaMarkup";
import { toast } from "../utils/toast";
import Container from "../components/ui/layout/Container";
import { colors } from "../components/ui/design-system/tokens";
import {
  createAriaLabel,
  createAriaLive,
  createAriaBusy,
  focusStyles,
  keyboardHandlers,
} from "../components/ui/design-system/accessibility";
import {
  useConnectionMonitoring,
  ConnectionMonitoringState,
} from "../hooks/useConnectionMonitoring";

interface HomePageProps {
  promotionalBanner?: {
    active: boolean;
    content: {
      en: string;
      fr: string;
    };
    link?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

interface GridItem {
  type: "product" | "empty";
  slotNumber: number;
  slot?: Slot;
}

// Memoized components
const MemoizedProductCard = memo(ProductCard);

const HomePage: React.FC<HomePageProps> = (_props) => {
  const { isAdmin } = useUnifiedAuth();
  const { t, language } = useLanguage();
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>(
    SortCriteria.NEWEST,
  );
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Fetch slots with their associated products - conditionally use the debug hook
  const normalSlots = useSlots();
  const debugSlots = useDebugSlots();

  // Use either normal or debug hook results
  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
    refresh: refreshSlots,
  } = debugMode ? debugSlots : normalSlots;

  // Fetch categories
  const { categories } = useCategories();

  // Text content with bilingual support
  const text = {
    welcome: {
      en: "Discover Today's Limited-Time Offers in Cameroon!",
      fr: "Découvrez les Offres à Durée Limitée d'Aujourd'hui au Cameroun!",
    },
    tagline: {
      en: "Don't Miss Out! New Deals Drop Daily!",
      fr: "Ne Manquez Pas! De Nouvelles Offres Tombent Chaque Jour!",
    },
    productGridHeading: {
      en: "New Arrivals!",
      fr: "Nouveautés!",
    },
    noProductsFound: {
      en: "No products found",
      fr: "Aucun produit trouvé",
    },
    errorMessage: {
      en: "Failed to load products. Please try again.",
      fr: "Échec du chargement des produits. Veuillez réessayer.",
    },
    retryButton: {
      en: "Retry",
      fr: "Réessayer",
    },
    skipToContent: {
      en: "Skip to main content",
      fr: "Passer au contenu principal",
    },
    debugModeOn: {
      en: "🔍 Debug Mode: ON",
      fr: "🔍 Mode Débogage: ACTIVÉ",
    },
    debugModeOff: {
      en: "🔍 Debug Mode: OFF",
      fr: "🔍 Mode Débogage: DÉSACTIVÉ",
    },
    totalSlots: {
      en: "Total Slots",
      fr: "Emplacements Totaux",
    },
    withProductId: {
      en: "With Product ID",
      fr: "Avec ID de Produit",
    },
    refreshSlots: {
      en: "Refresh Slots",
      fr: "Actualiser les Emplacements",
    },
    reloadPage: {
      en: "Reload Page",
      fr: "Recharger la Page",
    },
    debugInfo: {
      en: "Debug Information",
      fr: "Informations de Débogage",
    },
    slotsSummary: {
      en: "Slots Summary",
      fr: "Résumé des Emplacements",
    },
  };

  // Make handlers use useCallback
  const handleCategoryChange = useCallback((category: string | null) => {
    setFilterCategory(category);
  }, []);

  const handleSortChange = useCallback((newSortCriteria: SortCriteria) => {
    setSortCriteria(newSortCriteria);
  }, []);

  // Admin-only debug logging
  useEffect(() => {
    if (isAdmin && !slotsLoading && !slotsError && slots) {
      console.log("[Admin] Slots fetched:", slots.length);
      console.log(
        "[Admin] Slots with live products:",
        slots.filter(
          (slot) => slot.live_product_seller_id || slot.live_product_name_en,
        ).length,
      );
      const statusCounts = slots.reduce(
        (acc, slot) => {
          acc[slot.slot_status] = (acc[slot.slot_status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      console.log("[Admin] Slot statuses:", statusCounts);
    }
  }, [slots, slotsLoading, slotsError, isAdmin]);

  // Use connection monitoring hook - Destructure state correctly
  const connectionState: ConnectionMonitoringState = useConnectionMonitoring({
    checkInterval: 30000,
    showToasts: process.env.NODE_ENV === "production",
    onStatusChange: (status) => {
      if (!status.isConnected && isAdmin) {
        console.log("[Admin] Connection lost:", status.error?.message);
      }
    },
  });

  // Create grid items from slots
  const gridItems = useMemo<GridItem[]>(() => {
    const allSlotNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
    if (!slots)
      return allSlotNumbers.map((n) => ({ type: "empty", slotNumber: n })); // Handle loading state

    let displayableSlots = [...slots];

    // Non-admins only see 'live' slots
    if (!isAdmin) {
      displayableSlots = displayableSlots.filter(
        (slot) => slot.slot_status === "live",
      );
    }
    // Remove the invalid filter: Admins see all ('live', 'empty', 'maintenance')
    // else {
    //   displayableSlots = displayableSlots.filter(
    //       (slot) => slot.slot_status !== 'draft' // INVALID: 'draft' is not a possible slot_status
    //   );
    // }

    if (filterCategory) {
      displayableSlots = displayableSlots.filter((slot) =>
        slot.live_product_categories?.includes(filterCategory),
      );
    }

    displayableSlots.sort((a, b) => {
      switch (sortCriteria) {
        case SortCriteria.PRICE_ASC:
          return (
            (a.live_product_price ?? Infinity) -
            (b.live_product_price ?? Infinity)
          );
        case SortCriteria.PRICE_DESC:
          return (
            (b.live_product_price ?? -Infinity) -
            (a.live_product_price ?? -Infinity)
          );
        case SortCriteria.ENDING_SOON:
          const dateA = a.end_time ? new Date(a.end_time).getTime() : Infinity;
          const dateB = b.end_time ? new Date(b.end_time).getTime() : Infinity;
          return dateA - dateB;
        case SortCriteria.NEWEST:
        default:
          const startA = a.start_time
            ? new Date(a.start_time).getTime()
            : -Infinity;
          const startB = b.start_time
            ? new Date(b.start_time).getTime()
            : -Infinity;
          return startB - startA;
      }
    });

    const filledSlotsMap = new Map<number, Slot>();
    displayableSlots.forEach((slot) => {
      // Ensure slot ID is within the valid range 1-25
      if (slot.id >= 1 && slot.id <= 25) {
        filledSlotsMap.set(slot.id, slot);
      }
    });

    const finalGridItems = allSlotNumbers.map((slotNumber) => {
      const slotData = filledSlotsMap.get(slotNumber);
      // Only map a slot as 'product' if it's actually 'live'
      if (slotData && slotData.slot_status === "live") {
        return {
          type: "product" as const,
          slotNumber: slotData.id,
          slot: slotData,
        };
      } else {
        // All other slots (empty, maintenance, or filtered out) render as empty placeholders
        return {
          type: "empty" as const,
          slotNumber: slotNumber,
        };
      }
    });

    return finalGridItems;
  }, [slots, filterCategory, sortCriteria, isAdmin]);

  // Get only products from grid items for display
  const productItems = useMemo(() => {
    return gridItems.filter((item) => item.type === "product");
  }, [gridItems]);

  // Website schema for homepage
  const websiteSchema = useMemo(() => {
    return generateWebsiteSchema(["en", "fr"]);
  }, []);

  // Function to handle keyboard navigation for debug toggle
  const handleDebugToggle = useCallback(() => {
    setDebugMode(!debugMode);
  }, [debugMode]);

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          borderWidth: 0,
          ...focusStyles.keyboard,
        }}
        onFocus={(e) => {
          // Apply focus styles manually on focus
          const target = e.currentTarget;
          target.style.position = "fixed";
          target.style.top = "16px";
          target.style.left = "16px";
          target.style.width = "auto";
          target.style.height = "auto";
          target.style.padding = "8px 16px";
          target.style.clip = "auto";
          target.style.backgroundColor = colors.primary[500];
          target.style.color = "white";
          target.style.zIndex = "9999";
          target.style.textDecoration = "none";
          target.style.borderRadius = "4px";
        }}
        onBlur={(e) => {
          // Reset styles on blur
          const target = e.currentTarget;
          target.style.position = "absolute";
          target.style.width = "1px";
          target.style.height = "1px";
          target.style.padding = "0";
          target.style.margin = "-1px";
          target.style.overflow = "hidden";
          target.style.clip = "rect(0, 0, 0, 0)";
        }}
      >
        {t(text.skipToContent)}
      </a>

      <Container maxWidth="xl" padding={4} className="py-8">
        <SeoComponent
          title={text.welcome}
          description={text.tagline}
          ogType="website"
          ogImage="/images/sokoclick-social-card.jpg"
          jsonLd={websiteSchema}
        />

        {/* Header Section */}
        <header className="mb-12 relative">
          {/* Hero section with background gradient */}
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl overflow-hidden">
            <div className="absolute inset-0 opacity-20" aria-hidden="true">
              <svg
                className="h-full w-full"
                viewBox="0 0 600 600"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(300,300)">
                  <path
                    d="M125,-160.4C159.9,-146.7,184.6,-107.3,190.4,-67C196.2,-26.7,183.1,14.4,169.6,56.8C156.2,99.2,142.3,143,115.8,172C89.3,201.1,50.1,215.4,9.2,209.3C-31.7,203.2,-74.4,176.7,-104.3,147.7C-134.3,118.7,-151.5,87.1,-161.9,51.5C-172.3,15.9,-175.8,-23.7,-166.7,-61.7C-157.6,-99.7,-135.9,-136.2,-105.1,-153.9C-74.2,-171.6,-34.1,-170.6,5.7,-179C45.5,-187.4,90.1,-174.1,125,-160.4Z"
                    fill="currentColor"
                  />
                </g>
              </svg>
            </div>

            <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
              <div className="md:max-w-2xl text-center mx-auto">
                <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
                  {t(text.welcome)}
                </h1>
                <p className="text-xl md:text-2xl font-medium text-indigo-100 mb-8">
                  {t(text.tagline)}
                </p>

                {/* Admin debug mode toggle - accessibility improved */}
                {isAdmin && (
                  <div className="mt-6">
                    <button
                      onClick={handleDebugToggle}
                      className={`px-3 py-1 text-sm font-medium border rounded-md ${
                        debugMode
                          ? "bg-orange-100 border-orange-300 text-orange-600"
                          : "bg-white/80 border-white/30 text-white"
                      }`}
                      {...createAriaLabel(
                        t(debugMode ? text.debugModeOn : text.debugModeOff),
                      )}
                      {...keyboardHandlers.button(handleDebugToggle)}
                      style={focusStyles.keyboard}
                    >
                      {debugMode ? t(text.debugModeOn) : t(text.debugModeOff)}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Decorative elements */}
            <div
              className="absolute bottom-0 left-0 right-0"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                className="w-full h-12 md:h-16 text-gray-50"
              >
                <path
                  d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V69.35C65.79,69.43,132.33,70.39,198,81.89,250,90.61,295.07,96.68,321.39,56.44Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main id="main-content" tabIndex={-1} style={{ outline: "none" }}>
          {/* Filters Section */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <CategoryFilter
              categories={categories || []}
              selectedCategory={filterCategory}
              onCategoryChange={handleCategoryChange}
            />
            <div className="flex items-center gap-4">
              <SortingSelector
                value={sortCriteria}
                onChange={handleSortChange}
              />
              <LanguageToggle compact />
            </div>
          </div>

          {/* Debug Info Section - Correct connection state access */}
          {isAdmin && debugMode && !slotsLoading && !slotsError && (
            <div
              className="mb-8 p-4 border border-orange-300 bg-orange-50 rounded-lg"
              role="region"
              aria-label={t(text.debugInfo)}
            >
              <h3 className="text-lg font-medium text-orange-800 mb-3">
                {t(text.debugInfo)}
              </h3>

              {/* Connection status section - Use connectionState properties */}
              <div className="mb-4 pb-4 border-b border-orange-200">
                <p className="text-sm font-medium text-orange-700 mb-2">
                  {t({ en: "Connection Status:", fr: "Statut de Connexion:" })}
                </p>
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      connectionState.isConnected
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm">
                    {connectionState.isConnected
                      ? t({
                          en: `Connected (${connectionState.latency ?? "N/A"}ms)`,
                          fr: `Connecté (${connectionState.latency ?? "N/A"}ms)`,
                        })
                      : t({ en: "Disconnected", fr: "Déconnecté" })}
                    {!connectionState.isConnected &&
                      connectionState.connectionStatus?.error && (
                        <span className="ml-2 text-xs text-red-600">
                          {connectionState.connectionStatus.error.message}
                        </span>
                      )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    {t(text.slotsSummary)}:
                  </p>
                  <ul className="text-sm text-orange-600 mt-1 space-y-1">
                    <li>
                      {t(text.totalSlots)}: {slots?.length || 0}
                    </li>
                    <li>
                      {t(text.withProductId)}:{" "}
                      {slots?.filter(
                        (s) =>
                          s.live_product_seller_id || s.live_product_name_en,
                      ).length || 0}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => refreshSlots()}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={focusStyles.keyboard}
                >
                  {t(text.refreshSlots)}
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  style={focusStyles.keyboard}
                >
                  {t(text.reloadPage)}
                </button>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">
              {t(text.productGridHeading)}
            </h2>

            {slotsLoading ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                {...createAriaBusy(true)}
                {...createAriaLive("polite")}
              >
                {Array.from({ length: 16 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="relative h-full"
                    aria-hidden="true"
                  >
                    <Skeleton
                      className={`w-full h-full rounded-lg bg-gray-200 ${prefersReducedMotion ? "" : "animate-pulse"}`}
                    />
                  </div>
                ))}
              </div>
            ) : slotsError ? (
              <div
                className="text-center py-12"
                role="alert"
                aria-live="assertive"
              >
                <p className="text-red-600 mb-4">{t(text.errorMessage)}</p>
                <button
                  onClick={() => refreshSlots()}
                  className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  style={focusStyles.keyboard}
                >
                  {t(text.retryButton)}
                </button>
              </div>
            ) : productItems.length > 0 ? (
              <div
                tabIndex={-1}
                aria-label={t(text.productGridHeading)}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
                style={{ outline: "none" }}
              >
                {gridItems.map((item) =>
                  item.type === "product" && item.slot ? (
                    <MemoizedProductCard
                      key={`slot-${item.slotNumber}`}
                      slot={item.slot}
                      isAdmin={isAdmin}
                      className="h-full"
                    />
                  ) : (
                    <div
                      key={`empty-${item.slotNumber}`}
                      className="aspect-w-4 aspect-h-5 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"
                      aria-hidden="true"
                    ></div>
                  ),
                )}
              </div>
            ) : (
              <div
                className="text-center py-16 border border-gray-200 rounded-lg"
                role="region"
                aria-live="polite"
              >
                <p className="text-gray-600 mb-4">{t(text.noProductsFound)}</p>
              </div>
            )}
          </section>
        </main>
      </Container>
    </>
  );
};

export default memo(HomePage);
