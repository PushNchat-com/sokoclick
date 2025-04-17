import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { mockSupabase, resetMockData, seedMockData } from '../../utils/tests/supabaseMock';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock the hooks and context
vi.mock('../../hooks/useMockData', () => ({
  useMockAuctionSlotById: vi.fn((slotId) => {
    const mockSlot = {
      id: 1,
      is_active: true,
      featured: true,
      end_time: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      view_count: 10,
      product: {
        id: 'product1',
        name_en: 'Test Product',
        name_fr: 'Produit de Test',
        description_en: 'This is a test product',
        description_fr: 'Ceci est un produit de test',
        starting_price: 1000,
        currency: 'XAF',
        condition: 'New',
        seller_whatsapp: '237673870377',
        image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      }
    };
    
    return {
      slot: mockSlot,
      loading: false,
      error: null
    };
  })
}));

vi.mock('../../context/WhatsAppContext', () => ({
  useWhatsApp: vi.fn(() => ({
    initiateConversation: vi.fn().mockResolvedValue('mock-conversation-id')
  }))
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user1', email: 'user@example.com' },
    loading: false
  }))
}));

vi.mock('../../providers/ToastProvider', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn()
  }))
}));

// Mock the i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn()
    }
  })
}));

// Mock lazy-loaded components
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    lazy: (importFn) => {
      const Component = () => <div data-testid="mock-countdown">10:30:00</div>;
      return Component;
    },
    Suspense: ({ children }) => children
  };
});

// Mock the components
vi.mock('../../components/layout/Header', () => ({
  default: () => <header data-testid="mock-header">Header</header>
}));

vi.mock('../../components/layout/Footer', () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>
}));

vi.mock('../../components/LazyImage', () => ({
  default: ({ src, alt }) => <img src={src} alt={alt} data-testid="mock-lazy-image" />
}));

// Import the component under test
import AuctionDetail from '../../pages/AuctionDetail';

describe('AuctionDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockData();
    
    // Seed the mockSupabase with test data
    seedMockData({
      users: [
        { id: 'user1', email: 'user@example.com', role: 'buyer' }
      ],
      products: [
        {
          id: 'product1',
          name_en: 'Test Product',
          name_fr: 'Produit de Test',
          description_en: 'This is a test product',
          description_fr: 'Ceci est un produit de test',
          starting_price: 1000,
          currency: 'XAF',
          condition: 'New',
          seller_id: 'seller1'
        }
      ],
      auction_slots: [
        {
          id: 1,
          product_id: 'product1',
          is_active: true,
          featured: true,
          end_time: new Date(Date.now() + 86400000).toISOString(),
          view_count: 10
        }
      ]
    });
  });

  it('renders the auction detail page with product information', async () => {
    render(
      <MemoryRouter initialEntries={['/sc/1']}>
        <Routes>
          <Route path="/sc/:slotId" element={<AuctionDetail />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Check that basic elements are rendered
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    
    // Check that product information is displayed
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product')).toBeInTheDocument();
    expect(screen.getByText('1,000 XAF')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    
    // Check for the WhatsApp contact button
    const whatsappButton = screen.getByText('contactViaTwhatsApp');
    expect(whatsappButton).toBeInTheDocument();
    
    // Check for the image
    const images = screen.getAllByTestId('mock-lazy-image');
    expect(images.length).toBeGreaterThan(0);
    
    // Check for the countdown timer
    expect(screen.getByTestId('mock-countdown')).toBeInTheDocument();
  });

  it('shows loading state initially when loading is true', async () => {
    // Override the mock to return loading state
    vi.mocked(useMockAuctionSlotById).mockReturnValueOnce({
      slot: null,
      loading: true,
      error: null
    });
    
    render(
      <MemoryRouter initialEntries={['/sc/1']}>
        <Routes>
          <Route path="/sc/:slotId" element={<AuctionDetail />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Check that loading state is displayed
    const loadingElements = screen.getAllByTestId(/animate-pulse/);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('shows error state when there is an error', async () => {
    // Override the mock to return error state
    vi.mocked(useMockAuctionSlotById).mockReturnValueOnce({
      slot: null,
      loading: false,
      error: new Error('Failed to load auction')
    });
    
    render(
      <MemoryRouter initialEntries={['/sc/1']}>
        <Routes>
          <Route path="/sc/:slotId" element={<AuctionDetail />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Check that error message is displayed
    expect(screen.getByText('errorOccurred')).toBeInTheDocument();
    expect(screen.getByText('Failed to load auction')).toBeInTheDocument();
  });
});

function useMockAuctionSlotById(slotId: number) {
  throw new Error('Function not implemented.');
} 