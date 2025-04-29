// Mock product data for testing the HomePage grid
// This will be replaced with real data from Supabase later

import { ProductCardProps } from "../components/product/ProductCard";

// Type for a product that can be used with ProductCard
export type Product = ProductCardProps["product"];

// Mock products to fill various slots
export const mockProducts: Product[] = [
  {
    id: "1",
    slotNumber: 5,
    title: {
      en: "iPhone 13 Pro Max - Excellent Condition",
      fr: "iPhone 13 Pro Max - Excellent État",
    },
    price: 450000,
    currency: "XAF",
    mainImage:
      "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?q=80&w=400",
    additionalImages: [
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=400",
      "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=400",
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
    },
    deliveryOptions: {
      availableAreas: ["Douala", "Yaoundé"],
      estimatedDays: 2,
      hasFee: true,
      feeAmount: 2000,
    },
  },
  {
    id: "2",
    slotNumber: 8,
    title: {
      en: "Sony PlayStation 5 with 2 Controllers",
      fr: "Sony PlayStation 5 avec 2 Manettes",
    },
    price: 380000,
    currency: "XAF",
    mainImage:
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=400",
    listingTime: {
      startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    },
    seller: {
      name: "Jean Pierre",
      whatsappNumber: "237611223344",
      location: "Yaoundé, Cameroon",
      isVerified: false,
    },
  },
  {
    id: "3",
    slotNumber: 13,
    title: {
      en: "Canon EOS R5 Mirrorless Camera",
      fr: "Appareil Photo Canon EOS R5 sans Miroir",
    },
    price: 1200000,
    currency: "XAF",
    mainImage:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400",
    additionalImages: [
      "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?q=80&w=400",
    ],
    listingTime: {
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    },
    seller: {
      name: "Photo Studio Pro",
      whatsappNumber: "237655443322",
      location: "Douala, Cameroon",
      isVerified: true,
    },
    deliveryOptions: {
      availableAreas: ["Douala", "Yaoundé", "Bafoussam"],
      estimatedDays: 3,
      hasFee: true,
      feeAmount: 3000,
    },
  },
  {
    id: "4",
    slotNumber: 17,
    title: {
      en: 'MacBook Pro 16" M2 Pro - 1TB SSD',
      fr: 'MacBook Pro 16" M2 Pro - 1TB SSD',
    },
    price: 1500000,
    currency: "XAF",
    mainImage:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400",
    listingTime: {
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    },
    seller: {
      name: "Tech Imports",
      whatsappNumber: "237677889900",
      location: "Douala, Cameroon",
      isVerified: true,
    },
  },
  {
    id: "5",
    slotNumber: 22,
    title: {
      en: 'Samsung 65" QLED TV - 4K Smart TV',
      fr: 'Samsung 65" TV QLED - Smart TV 4K',
    },
    price: 750000,
    currency: "XAF",
    mainImage:
      "https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=400",
    listingTime: {
      startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    },
    seller: {
      name: "Electronics Plus",
      whatsappNumber: "237699887766",
      location: "Yaoundé, Cameroon",
      isVerified: true,
    },
    deliveryOptions: {
      availableAreas: ["Yaoundé"],
      estimatedDays: 1,
      hasFee: true,
      feeAmount: 5000,
    },
  },
];

// Record of which slots are empty
export const mockEmptySlots = Array.from(
  { length: 25 },
  (_, i) => i + 1,
).filter(
  (slotNumber) =>
    !mockProducts.some((product) => product.slotNumber === slotNumber),
);
