import { createClient } from '@supabase/supabase-js';
import { Database, SupabaseClientWithTypes } from '../types/supabase';

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sample product images by category
const productImages = {
  electronics: [
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&auto=format&fit=crop',
  ],
  homegoods: [
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop',
  ],
  jewelry: [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617038260897-43ea1b4a95c2?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop',
  ],
  collectibles: [
    'https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579656450812-5b1da79e9fe3?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1577083288073-40892c0860a4?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586075198429-94586aba6cc9?w=800&auto=format&fit=crop',
  ]
};

// Sample product data by category
const productData = {
  electronics: [
    { nameEn: 'Premium Wireless Headphones', nameFr: 'Casque Sans Fil Premium', price: 30000 },
    { nameEn: '4K Smart TV 55"', nameFr: 'TV Intelligent 4K 55"', price: 250000 },
    { nameEn: 'Professional Camera', nameFr: 'Caméra Professionnelle', price: 180000 },
    { nameEn: 'Gaming Console', nameFr: 'Console de Jeu', price: 150000 },
    { nameEn: 'Smartphone Pro Max', nameFr: 'Smartphone Pro Max', price: 220000 },
  ],
  fashion: [
    { nameEn: 'Designer Handbag', nameFr: 'Sac à Main de Designer', price: 85000 },
    { nameEn: 'Luxury Watch', nameFr: 'Montre de Luxe', price: 120000 },
    { nameEn: 'Silk Evening Gown', nameFr: 'Robe de Soirée en Soie', price: 65000 },
    { nameEn: 'Italian Leather Shoes', nameFr: 'Chaussures en Cuir Italien', price: 45000 },
    { nameEn: 'Cashmere Sweater', nameFr: 'Pull en Cachemire', price: 38000 },
  ],
  homegoods: [
    { nameEn: 'Handcrafted Dining Table', nameFr: 'Table à Manger Artisanale', price: 95000 },
    { nameEn: 'Luxury Bedding Set', nameFr: 'Ensemble de Literie de Luxe', price: 42000 },
    { nameEn: 'Crystal Chandelier', nameFr: 'Lustre en Cristal', price: 78000 },
    { nameEn: 'Persian Handwoven Rug', nameFr: 'Tapis Persan Tissé à la Main', price: 110000 },
    { nameEn: 'Marble Coffee Table', nameFr: 'Table Basse en Marbre', price: 65000 },
  ],
  jewelry: [
    { nameEn: 'Diamond Engagement Ring', nameFr: 'Bague de Fiançailles en Diamant', price: 280000 },
    { nameEn: 'Gold Tennis Bracelet', nameFr: 'Bracelet Tennis en Or', price: 150000 },
    { nameEn: 'Pearl Necklace', nameFr: 'Collier de Perles', price: 95000 },
    { nameEn: 'Sapphire Earrings', nameFr: 'Boucles d\'Oreilles en Saphir', price: 120000 },
    { nameEn: 'Vintage Brooch', nameFr: 'Broche Vintage', price: 65000 },
  ],
  collectibles: [
    { nameEn: 'Rare Vintage Watch', nameFr: 'Montre Vintage Rare', price: 180000 },
    { nameEn: 'Limited Edition Artwork', nameFr: 'Œuvre d\'Art en Édition Limitée', price: 240000 },
    { nameEn: 'Antique Ceramic Vase', nameFr: 'Vase Antique en Céramique', price: 85000 },
    { nameEn: 'First Edition Book', nameFr: 'Livre Première Édition', price: 95000 },
    { nameEn: 'Collectible Action Figure', nameFr: 'Figurine à Collectionner', price: 45000 },
  ]
};

// For development mode, use mock client when proper credentials aren't provided
let supabase: SupabaseClientWithTypes;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using mock client for development.');
  
  // Create a mock client for development
  const mockUrl = 'https://mock.supabase.co';
  const mockKey = 'mock-key';
  
  // Cast the basic client to our typed client for development purposes
  supabase = createClient<Database>(mockUrl, mockKey) as SupabaseClientWithTypes;
  
  // Generate a single mock product
  const generateMockProduct = (id: number) => {
    // Determine if this slot should have a product or be empty
    const hasProduct = id < 20; // 20 filled slots, 5 empty
    
    if (!hasProduct) {
      return null;
    }
    
    // Determine category for this product
    const categories = Object.keys(productData);
    const category = categories[id % categories.length];
    
    // Get product data and images for this category
    const categoryProducts = productData[category as keyof typeof productData];
    const categoryImages = productImages[category as keyof typeof productImages];
    
    // Select a specific product and image
    const productIndex = id % categoryProducts.length;
    const imageIndex = id % categoryImages.length;
    const product = categoryProducts[productIndex];
    
    // Add some randomization to creation dates
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - randomDaysAgo);
    
    // Set end time between 1-7 days in the future
    const daysToEnd = Math.floor(Math.random() * 7) + 1;
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + daysToEnd);
    
    // Randomize the condition
    const conditions = ['New', 'Like New', 'Good', 'Used'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    // Generate descriptive text
    const descriptionEn = `This is a premium ${product.nameEn.toLowerCase()} in ${condition.toLowerCase()} condition. Perfect for collectors and enthusiasts. Category: ${category}. Limited availability.`;
    const descriptionFr = `C'est un ${product.nameFr.toLowerCase()} premium en état ${condition.toLowerCase()}. Parfait pour les collectionneurs et les passionnés. Catégorie: ${category}. Disponibilité limitée.`;
    
    return {
      id: `mock-product-${id}`,
      name_en: product.nameEn,
      name_fr: product.nameFr,
      description_en: descriptionEn,
      description_fr: descriptionFr,
      image_urls: [categoryImages[imageIndex]],
      starting_price: product.price,
      currency: 'XAF',
      condition: condition,
      seller_id: `mock-seller-${Math.floor(Math.random() * 10) + 1}`,
      seller_whatsapp: `+237${Math.floor(Math.random() * 90000000) + 10000000}`
    };
  };
  
  // Define types for the mock API
  type MockOnFulfilled<T> = ((value: { data: T | null; error: null }) => void) | undefined;
  
  // Override methods with mock implementations
  supabase.from = (table: string) => {
    return {
      select: (query: string = '*') => ({
        order: (column: string, { ascending = true } = {}) => ({
          order: (column2: string, options = {}) => ({
            range: (from: number, to: number) => ({
              async then(onfulfilled: MockOnFulfilled<any>) {
                if (table === 'auction_slots') {
                  // Generate a range of auction slots based on the requested range
                  const mockSlots = Array(to - from + 1).fill(null).map((_, i) => {
                    const slotId = from + i + 1;
                    const product = generateMockProduct(slotId);
                    
                    return {
                      id: slotId,
                      product_id: product ? `mock-product-${slotId}` : null,
                      is_active: product !== null,
                      start_time: product ? new Date().toISOString() : null,
                      end_time: product ? new Date(Date.now() + (Math.random() * 7 * 86400000)).toISOString() : null,
                      featured: slotId % 5 === 0, // Every 5th item is featured
                      view_count: Math.floor(Math.random() * 500),
                      product: product
                    };
                  });
                  
                  return onfulfilled?.({ data: mockSlots, error: null });
                }
                return onfulfilled?.({ data: [], error: null });
              }
            }),
            eq: () => ({
              single: async () => ({ data: null, error: null }),
            }),
            async then(onfulfilled: MockOnFulfilled<any>) {
              // Mock data for auction slots
              if (table === 'auction_slots') {
                const mockSlots = Array(25).fill(null).map((_, i) => {
                  const product = generateMockProduct(i + 1);
                  
                  return {
                    id: i + 1,
                    product_id: product ? `mock-product-${i + 1}` : null,
                    is_active: product !== null,
                    start_time: product ? new Date().toISOString() : null,
                    end_time: product ? new Date(Date.now() + (Math.random() * 7 * 86400000)).toISOString() : null,
                    featured: (i + 1) % 5 === 0, // Every 5th item is featured
                    view_count: Math.floor(Math.random() * 500),
                    product: product
                  };
                });
                return onfulfilled?.({ data: mockSlots, error: null });
              }
              return onfulfilled?.({ data: [], error: null });
            }
          }),
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
          async then(onfulfilled: MockOnFulfilled<any>) {
            // Mock data for auction slots
            if (table === 'auction_slots') {
              const mockSlots = Array(25).fill(null).map((_, i) => {
                const product = generateMockProduct(i + 1);
                
                return {
                  id: i + 1,
                  product_id: product ? `mock-product-${i + 1}` : null,
                  is_active: product !== null,
                  start_time: product ? new Date().toISOString() : null,
                  end_time: product ? new Date(Date.now() + (Math.random() * 7 * 86400000)).toISOString() : null,
                  featured: (i + 1) % 5 === 0, // Every 5th item is featured
                  view_count: Math.floor(Math.random() * 500),
                  product: product
                };
              });
              return onfulfilled?.({ data: mockSlots, error: null });
            }
            return onfulfilled?.({ data: [], error: null });
          }
        }),
        single: async () => ({ data: null, error: null }),
      }),
      update: () => ({
        eq: async () => ({ data: null, error: null }),
      }),
    };
  };
  
  // Mock auth methods
  supabase.auth = {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ 
      data: { subscription: { unsubscribe: () => {} } } 
    }),
    signInWithPassword: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => {}
  };
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export { supabase };
export default supabase;
