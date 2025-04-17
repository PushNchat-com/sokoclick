import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockSupabase, resetMockData, seedMockData } from '../utils/tests/supabaseMock';

// Sample test data
const mockUsers = [
  {
    id: 'user1',
    email: 'user1@example.com',
    display_name: 'Test User 1',
    role: 'seller',
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
  },
  {
    id: 'user2',
    email: 'user2@example.com',
    display_name: 'Test User 2',
    role: 'buyer',
    created_at: '2023-01-02T12:00:00Z',
    updated_at: '2023-01-02T12:00:00Z',
  },
];

const mockProducts = [
  {
    id: 'product1',
    name: 'Test Product 1',
    price: 100,
    seller_id: 'user1',
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
  },
  {
    id: 'product2',
    name: 'Test Product 2',
    price: 200,
    seller_id: 'user1',
    created_at: '2023-01-02T12:00:00Z',
    updated_at: '2023-01-02T12:00:00Z',
  },
];

const mockAuctionSlots = [
  {
    id: 1,
    product_id: 'product1',
    is_active: true,
    start_time: '2023-01-01T12:00:00Z',
    end_time: '2023-01-10T12:00:00Z',
    featured: true,
    view_count: 10,
  },
  {
    id: 2,
    product_id: 'product2',
    is_active: true,
    start_time: '2023-01-05T12:00:00Z',
    end_time: '2023-01-15T12:00:00Z',
    featured: false,
    view_count: 5,
  },
];

describe('Supabase Mock Tests', () => {
  beforeEach(() => {
    // Reset mock data before each test
    resetMockData();
    // Seed with test data
    seedMockData({
      users: mockUsers,
      products: mockProducts,
      auction_slots: mockAuctionSlots,
    });
  });

  describe('Authentication', () => {
    it('should sign up a user', async () => {
      const { data, error } = await mockSupabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data?.user).toBeDefined();
      expect(data?.user.email).toBe('newuser@example.com');
    });

    it('should not sign up a user with existing email', async () => {
      const { data, error } = await mockSupabase.auth.signUp({
        email: 'user1@example.com', // existing user
        password: 'password123',
      });

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toBe('User already exists');
    });

    it('should sign in a user', async () => {
      const { data, error } = await mockSupabase.auth.signIn({
        email: 'user1@example.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data?.user).toBeDefined();
      expect(data?.user.email).toBe('user1@example.com');
    });
  });

  describe('Data Retrieval', () => {
    it('should fetch products', async () => {
      const { data, error } = await mockSupabase
        .from('products')
        .select('*')
        .execute();

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data![0].name).toBe('Test Product 1');
      expect(data![1].name).toBe('Test Product 2');
    });

    it('should filter products by seller_id', async () => {
      const { data, error } = await mockSupabase
        .from('products')
        .select('*')
        .eq('seller_id', 'user1')
        .execute();

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('should fetch a single product', async () => {
      const { data, error } = await mockSupabase
        .from('products')
        .select('*')
        .eq('id', 'product1')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.name).toBe('Test Product 1');
    });

    it('should fetch auction slots with filter and order', async () => {
      const { data, error } = await mockSupabase
        .from('auction_slots')
        .select('*')
        .eq('is_active', true)
        .order('view_count', { ascending: false })
        .execute();

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data![0].id).toBe(1); // The one with higher view_count
      expect(data![1].id).toBe(2);
    });
  });

  describe('Advanced Queries', () => {
    it('should support range pagination', async () => {
      // Add more mock data to test pagination
      seedMockData({
        products: [
          {
            id: 'product3',
            name: 'Test Product 3',
            price: 300,
            seller_id: 'user1',
            created_at: '2023-01-03T12:00:00Z',
            updated_at: '2023-01-03T12:00:00Z',
          },
          {
            id: 'product4',
            name: 'Test Product 4',
            price: 400,
            seller_id: 'user1',
            created_at: '2023-01-04T12:00:00Z',
            updated_at: '2023-01-04T12:00:00Z',
          },
        ],
      });

      const { data, error } = await mockSupabase
        .from('products')
        .select('*')
        .range(0, 1) // First 2 products
        .execute();

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('should support multiple conditions', async () => {
      const { data, error } = await mockSupabase
        .from('auction_slots')
        .select('*')
        .eq('is_active', true)
        .eq('featured', true)
        .execute();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(1);
    });

    it('should support field selection', async () => {
      const { data, error } = await mockSupabase
        .from('products')
        .select('id,name')
        .execute();

      expect(error).toBeNull();
      expect(data![0]).toHaveProperty('id');
      expect(data![0]).toHaveProperty('name');
      expect(data![0]).not.toHaveProperty('price');
    });
  });
}); 