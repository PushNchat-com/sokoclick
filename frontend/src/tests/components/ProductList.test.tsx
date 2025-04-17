import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { mockSupabase, resetMockData, seedMockData } from '../../utils/tests/supabaseMock';
import '@testing-library/jest-dom';

// Mock the API module
vi.mock('../../api/testableApi', () => ({
  productApi: {
    getProducts: vi.fn().mockImplementation(async () => {
      // Use the mock data directly
      const { data } = await mockSupabase
        .from('products')
        .select('*')
        .execute();
      return data;
    }),
    getProductsBySellerId: vi.fn().mockImplementation(async (sellerId) => {
      // Use the mock data directly
      const { data } = await mockSupabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .execute();
      return data;
    })
  }
}));

// Simple ProductList component to test
const ProductList = ({ sellerId = null }: { sellerId?: string | null }) => {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = sellerId 
          ? await productApi.getProductsBySellerId(sellerId)
          : await productApi.getProducts();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sellerId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (products.length === 0) return <div>No products found</div>;

  return (
    <div>
      <h2>Products</h2>
      <ul>
        {products.map(product => (
          <li key={product.id} data-testid="product-item">
            <h3>{product.name}</h3>
            <p>Price: {product.price}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Mock the React import
import React from 'react';
import { productApi } from '../../api/testableApi';

describe('ProductList Component', () => {
  const testProducts = [
    {
      id: 'product1',
      name: 'Test Product 1',
      price: 100,
      seller_id: 'seller1',
    },
    {
      id: 'product2',
      name: 'Test Product 2',
      price: 200,
      seller_id: 'seller1',
    },
    {
      id: 'product3',
      name: 'Test Product 3', 
      price: 300,
      seller_id: 'seller2',
    },
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    resetMockData();
    
    // Seed test data
    seedMockData({
      products: testProducts
    });
  });

  it('should render loading state initially', () => {
    render(<ProductList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render all products', async () => {
    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    expect(screen.getAllByTestId('product-item')).toHaveLength(3);
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('Test Product 3')).toBeInTheDocument();
  });

  it('should filter products by seller ID', async () => {
    render(<ProductList sellerId="seller2" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    expect(screen.getAllByTestId('product-item')).toHaveLength(1);
    expect(screen.getByText('Test Product 3')).toBeInTheDocument();
    expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument();
  });

  it('should show a message when no products found', async () => {
    // Clear all products
    resetMockData();
    
    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });
}); 