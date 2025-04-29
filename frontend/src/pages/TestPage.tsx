import React, { useState } from "react";
import ProductCard from "../components/product/ProductCard";
import EmptySlotCard from "../components/product/EmptySlotCard";

// Mock product data for testing
const mockProduct = {
  id: "1",
  slotNumber: 5,
  title: {
    en: "iPhone 13 Pro Max - Excellent Condition",
    fr: "iPhone 13 Pro Max - Excellent État",
  },
  description: {
    en: "Barely used iPhone 13 Pro Max with all accessories. No scratches, perfect condition.",
    fr: "iPhone 13 Pro Max à peine utilisé avec tous les accessoires. Pas de rayures, parfait état.",
  },
  price: 450000,
  currency: "XAF" as const,
  mainImage:
    "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?q=80&w=1000",
  additionalImages: [
    "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=1000",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=1000",
  ],
  listingTime: {
    startTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
  },
  seller: {
    name: "Thomas Fouange",
    whatsappNumber: "237612345678",
    location: "Douala, Cameroon",
    isVerified: true,
    verificationLevel: "complete" as const,
    verificationDate: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    joinedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  category: "Electronics",
  condition: "used" as const,
  deliveryOptions: {
    availableAreas: ["Douala", "Yaoundé"],
    estimatedDays: 2,
    hasFee: true,
    feeAmount: 2000,
  },
};

// Mock ending soon product
const endingSoonProduct = {
  ...mockProduct,
  id: "2",
  slotNumber: 8,
  title: {
    en: "Sony PlayStation 5 with 2 Controllers",
    fr: "Sony PlayStation 5 avec 2 Manettes",
  },
  price: 380000,
  mainImage:
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=1000",
  additionalImages: [],
  listingTime: {
    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
  },
  seller: {
    ...mockProduct.seller,
    isVerified: false,
  },
};

const TestPage: React.FC = () => {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [adminMode, setAdminMode] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          SokoClick Component Test
        </h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-md text-sm font-medium"
          >
            {language === "en" ? "Switch to French" : "Switch to English"}
          </button>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={adminMode}
              onChange={() => setAdminMode(!adminMode)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Admin Mode
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <ProductCard
          product={mockProduct}
          currentLanguage={language}
          isAdmin={adminMode}
        />

        <ProductCard
          product={endingSoonProduct}
          currentLanguage={language}
          isAdmin={adminMode}
        />

        <EmptySlotCard
          slotNumber={12}
          currentLanguage={language}
          isAdmin={adminMode}
        />
      </div>
    </div>
  );
};

export default TestPage;
