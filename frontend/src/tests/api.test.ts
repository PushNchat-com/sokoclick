import { describe, it, expect, beforeEach } from 'vitest';
import { UserAPI, ProductAPI, AuctionAPI } from '../api/testableApi';
import { mockSupabase, resetMockData, seedMockData } from '../utils/tests/supabaseMock';

// Sample test data
const mockUsers = [
  {
    id: 'user1',
    email: 'user1@example.com',
    role: 'seller',
  },
];

const mockProfiles = [
  {
    id: 'user1',
    display_name: 'Test Seller',
    whatsapp_number: '+2376700001',
    location: 'Douala, Cameroon',
    bio: 'I sell quality products',
    rating: 4.5,
  },
];

const mockProducts = [
  {
    id: 'product1',
    name: 'Test Product 1',
    price: 100,
    seller_id: 'user1',
  },
  {
    id: 'product2',
    name: 'Test Product 2',
    price: 200,
    seller_id: 'user1',
  },
];

const mockAuctionSlots = [
  {
    id: 1,
    product_id: 'product1',
    is_active: true,
    featured: true,
    view_count: 10,
  },
  {
    id: 2,
    product_id: 'product2',
    is_active: true,
    featured: false,
    view_count: 5,
  },
];

describe('API Tests with Mock Supabase', () => {
  // Create API instances with mock client
  const userApi = new UserAPI(mockSupabase);
  const productApi = new ProductAPI(mockSupabase);
  const auctionApi = new AuctionAPI(mockSupabase);

  beforeEach(() => {
    // Reset and seed mock data before each test
    resetMockData();
    seedMockData({
      users: mockUsers,
      profiles: mockProfiles,
      products: mockProducts,
      auction_slots: mockAuctionSlots,
    });
  });

  describe('UserAPI', () => {
    it('should get a user profile by ID', async () => {
      const profile = await userApi.getUserProfile('user1');
      expect(profile).toBeDefined();
      expect(profile.display_name).toBe('Test Seller');
      expect(profile.whatsapp_number).toBe('+2376700001');
    });

    it('should throw an error if user ID is not provided', async () => {
      await expect(userApi.getUserProfile('')).rejects.toThrow('User ID is required');
    });

    it('should update a user profile', async () => {
      const updates = { display_name: 'Updated Name', bio: 'Updated bio' };
      await userApi.updateUserProfile('user1', updates);
      
      // Verify the update worked
      const updatedProfile = await userApi.getUserProfile('user1');
      expect(updatedProfile.display_name).toBe('Updated Name');
      expect(updatedProfile.bio).toBe('Updated bio');
    });
  });

  describe('ProductAPI', () => {
    it('should get all products', async () => {
      const products = await productApi.getProducts();
      expect(products).toHaveLength(2);
      expect(products[0].name).toBe('Test Product 1');
    });

    it('should get products by seller ID', async () => {
      const products = await productApi.getProductsBySellerId('user1');
      expect(products).toHaveLength(2);
      expect(products[0].seller_id).toBe('user1');
    });

    it('should get a single product by ID', async () => {
      const product = await productApi.getProductById('product1');
      expect(product).toBeDefined();
      expect(product.name).toBe('Test Product 1');
    });

    it('should create a new product', async () => {
      const newProduct = {
        id: 'product3',
        name: 'New Test Product',
        price: 300,
        seller_id: 'user1',
      };

      const createdProduct = await productApi.createProduct(newProduct);
      expect(createdProduct).toBeDefined();
      expect(createdProduct.name).toBe('New Test Product');

      // Verify it was added to the database
      const products = await productApi.getProducts();
      expect(products).toHaveLength(3);
    });

    it('should update a product', async () => {
      const updates = { name: 'Updated Product', price: 150 };
      await productApi.updateProduct('product1', updates);
      
      // Verify the update worked
      const updatedProduct = await productApi.getProductById('product1');
      expect(updatedProduct.name).toBe('Updated Product');
      expect(updatedProduct.price).toBe(150);
    });

    it('should delete a product', async () => {
      await productApi.deleteProduct('product1');
      
      // Verify it was deleted
      const products = await productApi.getProducts();
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe('product2');
    });
  });

  describe('AuctionAPI', () => {
    it('should get all auction slots', async () => {
      const slots = await auctionApi.getAuctionSlots();
      expect(slots).toHaveLength(2);
    });

    it('should get active auction slots', async () => {
      const slots = await auctionApi.getActiveAuctionSlots();
      expect(slots).toHaveLength(2);
    });

    it('should get featured auction slots', async () => {
      const slots = await auctionApi.getFeaturedAuctionSlots();
      expect(slots).toHaveLength(1);
      expect(slots[0].id).toBe(1);
    });

    it('should get a single auction slot by ID', async () => {
      const slot = await auctionApi.getAuctionSlotById(1);
      expect(slot).toBeDefined();
      expect(slot.product_id).toBe('product1');
    });

    it('should increment view count for an auction slot', async () => {
      const initialSlot = await auctionApi.getAuctionSlotById(1);
      const initialViewCount = initialSlot.view_count;
      
      await auctionApi.incrementViewCount(1);
      
      const updatedSlot = await auctionApi.getAuctionSlotById(1);
      expect(updatedSlot.view_count).toBe(initialViewCount + 1);
    });
  });
}); 