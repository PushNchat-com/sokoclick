// IMPORTANT: This file is deprecated
// We've consolidated the mock data implementation in ../services/mockData.ts
// Please import from there instead

import { 
  MOCK_SELLERS, 
  MOCK_PRODUCTS, 
  generateMockAuctionSlots, 
  getMockAuctionSlotById, 
  mockAuctionService,
  PRODUCT_CATEGORIES
} from '../services/mockData';

// Re-export for backward compatibility
export const mockProfiles = MOCK_SELLERS;
export const mockProducts = MOCK_PRODUCTS;
export const mockAuctionSlots = generateMockAuctionSlots();
export { getMockAuctionSlotById, mockAuctionService, PRODUCT_CATEGORIES };

// Print deprecation warning
console.warn(
  'Warning: Importing from /mock/mockData.ts is deprecated. ' +
  'Please import from /services/mockData.ts instead.'
);

// Function to get auction slots with pagination and filtering support
export const getMockAuctionSlots = (
  page: number = 1, 
  limit: number = 10,
  category?: string
): { data: AuctionSlot[], hasMore: boolean } => {
  let filteredSlots = [...mockAuctionSlots];
  
  // Filter by category if provided (in a real implementation, you'd have category data)
  if (category && category !== 'all') {
    // This is a mock implementation - in a real app, you'd have actual categories
    const categoryFilters: Record<string, (slot: AuctionSlot) => boolean> = {
      'phones': slot => slot.product?.name_en.toLowerCase().includes('iphone') || 
                        slot.product?.name_en.toLowerCase().includes('galaxy'),
      'computers': slot => slot.product?.name_en.toLowerCase().includes('macbook'),
      'cameras': slot => slot.product?.name_en.toLowerCase().includes('canon') ||
                         slot.product?.name_en.toLowerCase().includes('camera'),
      'gaming': slot => slot.product?.name_en.toLowerCase().includes('playstation'),
      'drones': slot => slot.product?.name_en.toLowerCase().includes('drone')
    };
    
    if (categoryFilters[category]) {
      filteredSlots = filteredSlots.filter(categoryFilters[category]);
    }
  }
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedSlots = filteredSlots.slice(startIndex, endIndex);
  
  return {
    data: paginatedSlots,
    hasMore: endIndex < filteredSlots.length
  };
}; 