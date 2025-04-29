import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { formatDistanceToNow } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { Card, CardContent } from "../components/ui/Card";
import ImageGallery from "../components/product/ImageGallery";
import TimeRemaining from "../components/product/TimeRemaining";
import SellerInfo from "../components/product/SellerInfo";
import DeliveryInfo from "../components/product/DeliveryInfo";
import WhatsAppButton from "../components/product/WhatsAppButton";
import Badge from "../components/ui/Badge";
import { useLanguage } from "../store/LanguageContext";
import {
  LocationIcon,
  ClockIcon,
  VerifiedIcon,
  CategoryIcon,
  TruckIcon,
  CashIcon,
  InfoIcon,
  BackIcon,
  CalendarIcon,
  WhatsAppIcon,
} from "../components/ui/Icons";
import SeoComponent from "../components/seo/SeoComponent";
import OptimizedImage from "../components/image/OptimizedImage";
import {
  generateProductSchema,
  generateBreadcrumbSchema,
} from "../utils/schemaMarkup";

// Product interface following SokoClick's data model
interface Product {
  id: string;
  slotNumber: number;
  title: {
    en: string;
    fr: string;
  };
  description: {
    en: string;
    fr: string;
  };
  price: number;
  currency: "XAF" | "FCFA";
  mainImage: string;
  images: Array<{
    url: string;
    alt?: string;
  }>;
  listingTime: {
    startTime: string; // ISO date string
    endTime: string; // ISO date string
  };
  seller: {
    name: string;
    whatsappNumber: string;
    location: string;
    isVerified: boolean;
    joinedDate: string;
    totalSales?: number;
    rating?: number;
  };
  category?: string;
  condition: "new" | "used" | "refurbished";
  views: number;
  deliveryOptions?: Array<{
    type: string;
    price: number;
    estimatedDelivery: string;
  }>;
}

// Mock data - to be replaced with API call
const mockProduct: Product = {
  id: "p123",
  slotNumber: 8,
  title: {
    en: "iPhone 12 Pro Max 256GB - Pacific Blue",
    fr: "iPhone 12 Pro Max 256 Go - Bleu Pacifique",
  },
  description: {
    en: "Excellent condition, barely used. Still under Apple warranty until November 2023. Includes original box, charger, and unused earphones.",
    fr: "Excellent état, à peine utilisé. Toujours sous garantie Apple jusqu'en novembre 2023. Comprend la boîte d'origine, le chargeur et des écouteurs non utilisés.",
  },
  price: 450000,
  currency: "XAF",
  mainImage:
    "https://images.unsplash.com/photo-1603891128711-11b4b03bb138?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aXBob25lJTIwMTIlMjBwcm98ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
  images: [
    {
      url: "https://images.unsplash.com/photo-1603891128711-11b4b03bb138?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aXBob25lJTIwMTIlMjBwcm98ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
      alt: "iPhone 12 Pro front view",
    },
    {
      url: "https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aXBob25lJTIwMTIlMjBwcm98ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
      alt: "iPhone 12 Pro back view",
    },
    {
      url: "https://images.unsplash.com/photo-1596558450268-9c27524ba856?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGlwaG9uZSUyMDEyJTIwcHJvfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
      alt: "iPhone 12 Pro with box",
    },
  ],
  listingTime: {
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    endTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days from now
  },
  seller: {
    name: "John Doe",
    whatsappNumber: "+237612345678",
    location: "Douala, Cameroon",
    isVerified: true,
    joinedDate: new Date(2022, 3, 15).toISOString(),
    totalSales: 24,
    rating: 4.8,
  },
  condition: "used",
  views: 128,
  category: "Electronics",
  deliveryOptions: [
    {
      type: "Cash on Delivery",
      price: 0,
      estimatedDelivery: "1-2 days",
    },
    {
      type: "Pickup",
      price: 0,
      estimatedDelivery: "Same day",
    },
  ],
};

// Localized texts
const localizedTexts = {
  productDetails: {
    en: "Product Details",
    fr: "Détails du Produit",
  },
  condition: {
    en: "Condition",
    fr: "État",
  },
  conditionTypes: {
    new: {
      en: "New",
      fr: "Neuf",
    },
    used: {
      en: "Used",
      fr: "Occasion",
    },
    refurbished: {
      en: "Refurbished",
      fr: "Reconditionné",
    },
  },
  location: {
    en: "Location",
    fr: "Emplacement",
  },
  listedOn: {
    en: "Listed on",
    fr: "Publié le",
  },
  views: {
    en: "Views",
    fr: "Vues",
  },
  description: {
    en: "Description",
    fr: "Description",
  },
  contactSeller: {
    en: "Contact Seller",
    fr: "Contacter le Vendeur",
  },
  slot: {
    en: "Slot",
    fr: "Emplacement",
  },
  deliveryOptions: {
    en: "Delivery Options",
    fr: "Options de Livraison",
  },
  cashOnDelivery: {
    en: "Cash on Delivery Only",
    fr: "Paiement à la Livraison Uniquement",
  },
  paymentMethod: {
    en: "Payment Method",
    fr: "Méthode de Paiement",
  },
  cashOnly: {
    en: "Cash Only",
    fr: "Espèces Uniquement",
  },
  shareProduct: {
    en: "Share Product",
    fr: "Partager le Produit",
  },
  sellerInfo: {
    en: "Seller Information",
    fr: "Informations sur le Vendeur",
  },
  payment: {
    en: "Payment",
    fr: "Paiement",
  },
  backToHome: {
    en: "Back to Home",
    fr: "Retour à l'Accueil",
  },
};

// Helper type for our translation function
type TranslationKey = keyof typeof localizedTexts;
type NestedTranslationKey<T> = T extends string ? never : keyof T;

interface ProductPageProps {
  isAdmin?: boolean;
}

const ProductPage: React.FC<ProductPageProps> = ({ isAdmin = false }) => {
  const { slotNumber } = useParams<{ slotNumber: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Text translation helper function
  const t = (key: keyof typeof localizedTexts): string => {
    const value = localizedTexts[key];
    if (typeof value === "string") return value;
    return (value as any)[language as "en" | "fr"] || "";
  };

  // Format date using format-distance with appropriate locale
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === "fr" ? fr : enUS,
    });
  };

  // Check if product is new (listed within 24 hours)
  const isNewListing = useMemo(() => {
    if (!product) return false;
    const now = new Date();
    const startTime = new Date(product.listingTime.startTime);
    return now.getTime() - startTime.getTime() < 24 * 60 * 60 * 1000;
  }, [product]);

  // Check if product is ending soon (within 24 hours)
  const isEndingSoon = useMemo(() => {
    if (!product) return false;
    const now = new Date();
    const endTime = new Date(product.listingTime.endTime);
    return endTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
  }, [product]);

  // Fetch product data based on slot number
  useEffect(() => {
    const fetchProduct = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call when backend is ready
        // const response = await fetch(`/api/products/slot/${slotNumber}`);
        // const data = await response.json();
        // setProduct(data);

        // Using mock data for now
        setTimeout(() => {
          setProduct(mockProduct);
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(
          language === "en"
            ? "Failed to load product details. Please try again."
            : "Échec du chargement des détails du produit. Veuillez réessayer.",
        );
        setLoading(false);
      }
    };

    if (slotNumber) {
      fetchProduct();
    }
  }, [slotNumber, language]);

  // Generate WhatsApp message
  const generateWhatsAppMessage = useMemo(() => {
    if (!product) return "";

    const productTitle = product.title[language as "en" | "fr"];

    return language === "en"
      ? `Hello, I'm interested in your product "${productTitle}" on SokoClick (Slot #${product.slotNumber}).`
      : `Bonjour, je suis intéressé par votre produit "${productTitle}" sur SokoClick (Emplacement #${product.slotNumber}).`;
  }, [product, language]);

  // Handle sharing functionality
  const handleShare = async () => {
    if (!product) return;

    const productTitle = product.title[language as "en" | "fr"];
    const shareData = {
      title: productTitle,
      text:
        language === "en"
          ? `Check out this product on SokoClick: ${productTitle}`
          : `Découvrez ce produit sur SokoClick: ${productTitle}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(window.location.href);
        alert(
          language === "en"
            ? "Link copied to clipboard!"
            : "Lien copié dans le presse-papiers !",
        );
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // Generate structured data for the product
  const productSchema = useMemo(() => {
    if (!product) return null;

    // Convert product data to schema format
    return generateProductSchema(
      {
        id: product.id,
        name: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        mainImage: product.mainImage,
        images: product.images.map((img) => img.url),
        condition:
          product.condition === "new"
            ? "NewCondition"
            : product.condition === "used"
              ? "UsedCondition"
              : "RefurbishedCondition",
        category: product.category,
        seller: {
          name: product.seller.name,
        },
        availability: "InStock",
      },
      language as "en" | "fr",
    );
  }, [product, language]);

  // Generate breadcrumb structured data
  const breadcrumbSchema = useMemo(() => {
    if (!product) return null;

    return generateBreadcrumbSchema(
      [
        { name: { en: "Home", fr: "Accueil" }, url: "https://sokoclick.com/" },
        {
          name: product.category
            ? { en: product.category, fr: product.category }
            : { en: "Products", fr: "Produits" },
          url: `https://sokoclick.com/category/${product.category?.toLowerCase() || "all"}`,
        },
        { name: product.title, url: window.location.href },
      ],
      language as "en" | "fr",
    );
  }, [product, language]);

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded aspect-square"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">
            {language === "en" ? "Error" : "Erreur"}
          </h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {localizedTexts.backToHome[language as "en" | "fr"]}
          </button>
        </div>
      </div>
    );
  }

  // Show 404 state if product not found
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">
            {language === "en"
              ? `Product in slot #${slotNumber} not found`
              : `Produit dans l'emplacement #${slotNumber} introuvable`}
          </h2>
          <p className="text-gray-500 mb-6">
            {language === "en"
              ? "The product you are looking for might be removed or does not exist"
              : "Le produit que vous recherchez a peut-être été supprimé ou n'existe pas"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {localizedTexts.backToHome[language as "en" | "fr"]}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {product && (
        <SeoComponent
          title={product.title}
          description={product.description}
          ogType="product"
          ogImage={product.images[0].url}
          ogImageAlt={
            product.images[0].alt || product.title[language as "en" | "fr"]
          }
          jsonLd={productSchema || undefined}
        />
      )}

      {/* Add breadcrumb structured data */}
      {breadcrumbSchema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbSchema)}
          </script>
        </Helmet>
      )}

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Page Header - Navigation and Slot */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-600 hover:text-gray-900 group"
          >
            <BackIcon className="mr-1 transition-transform group-hover:-translate-x-1" />
            {localizedTexts.backToHome[language as "en" | "fr"]}
          </button>
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium bg-primary-50 text-primary-700 px-3 py-1 rounded-full border border-primary-200">
              {localizedTexts.slot[language as "en" | "fr"]} #
              {product.slotNumber}
            </div>
          </div>
        </div>

        {/* Product Header - Title and Status Badges */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {product.title[language as "en" | "fr"]}
          </h1>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isNewListing && (
              <Badge variant="primary">
                {language === "en" ? "New Listing" : "Nouvelle Annonce"}
              </Badge>
            )}
            {isEndingSoon && (
              <Badge variant="secondary">
                {language === "en" ? "Ending Soon" : "Se Termine Bientôt"}
              </Badge>
            )}
            {product.category && (
              <Badge variant="outline">{product.category}</Badge>
            )}
            <Badge
              variant={
                product.condition === "new"
                  ? "success"
                  : product.condition === "used"
                    ? "warning"
                    : "default"
              }
            >
              {
                localizedTexts.conditionTypes[product.condition][
                  language as "en" | "fr"
                ]
              }
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Images (spans 3 columns on large screens) */}
          <div className="lg:col-span-3">
            <div className="sticky top-4">
              <div className="bg-white rounded-xl p-2 shadow-sm">
                {product.images.map((image, index) => (
                  <div
                    key={`image-${index}`}
                    className={index === 0 ? "block" : "hidden md:block mt-2"}
                  >
                    <OptimizedImage
                      src={image.url}
                      alt={image.alt || product.title[language as "en" | "fr"]}
                      width={index === 0 ? 800 : 150}
                      height={index === 0 ? 600 : 150}
                      className={index === 0 ? "rounded-lg" : "rounded-md"}
                      objectFit="contain"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Product Information (spans 2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price and Time Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                <div>
                  <span className="text-3xl font-bold text-gray-900">
                    {product.price.toLocaleString()} {product.currency}
                  </span>
                </div>
                <TimeRemaining
                  expiryDate={new Date(product.listingTime.endTime)}
                  showLabel={true}
                  variant="compact"
                  className="text-right"
                />
              </div>

              {/* Views Counter */}
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>
                  {product.views} {language === "en" ? "views" : "vues"}
                </span>
                <span className="mx-2">•</span>
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span>{formatDate(product.listingTime.startTime)}</span>
              </div>
            </div>

            {/* Cash on Delivery Badge */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center mb-2">
                <CashIcon className="text-amber-600 mr-2" />
                <h3 className="font-semibold text-amber-800">
                  {localizedTexts.paymentMethod[language as "en" | "fr"]}
                </h3>
              </div>
              <p className="text-sm text-amber-700">
                {language === "en"
                  ? "This product is available for cash payment on delivery or pickup only. No online payments."
                  : "Ce produit est disponible uniquement pour paiement en espèces à la livraison ou au retrait. Pas de paiements en ligne."}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col space-y-3">
              <WhatsAppButton
                phoneNumber={product.seller.whatsappNumber}
                message={generateWhatsAppMessage}
                buttonText={
                  localizedTexts.contactSeller[language as "en" | "fr"]
                }
                variant="large"
                className="w-full"
              />

              <div className="flex space-x-3">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50 font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  {localizedTexts.shareProduct[language as "en" | "fr"]}
                </button>
              </div>
            </div>

            {/* Seller Information */}
            <SellerInfo
              name={product.seller.name}
              registeredSince={new Date(product.seller.joinedDate)}
              isVerified={product.seller.isVerified}
              rating={product.seller.rating}
              totalSales={product.seller.totalSales}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            />

            {/* Delivery Options */}
            {product.deliveryOptions && product.deliveryOptions.length > 0 && (
              <DeliveryInfo
                options={product.deliveryOptions}
                location={product.seller.location}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              />
            )}
          </div>
        </div>

        {/* Product Details Sections - Full Width */}
        <div className="mt-8 space-y-6">
          {/* Product Description */}
          <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {localizedTexts.description[language as "en" | "fr"]}
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {product.description[language as "en" | "fr"]}
              </p>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {isAdmin && (
            <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {language === "en"
                    ? "Admin Actions"
                    : "Actions d'administrateur"}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                    <svg
                      className="w-5 h-5 mr-2 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    {language === "en" ? "Edit Product" : "Modifier le produit"}
                  </button>
                  <button className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
                    <svg
                      className="w-5 h-5 mr-2 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {language === "en"
                      ? "Remove Listing"
                      : "Supprimer l'annonce"}
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
