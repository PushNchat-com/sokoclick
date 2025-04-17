import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Import the mocked hook
import { useAuth } from '../../context/AuthContext';

// Import components
import Dashboard from '../../pages/Dashboard';

// Needed for route testing
const AdminDashboard = () => <div>Admin Dashboard</div>;
const SellerDashboard = () => <div>Seller Dashboard</div>;
const Home = () => <div>Home Page</div>;

describe('Dashboard Component', () => {
  // Helper function to setup the component with different auth states
  const renderWithRoutes = () => {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when auth is loading', () => {
    // Mock auth loading state
    vi.mocked(useAuth).mockReturnValue({
      userRole: undefined,
      loading: true,
      user: null
    });

    renderWithRoutes();

    // Should show loading state
    expect(screen.getByText(/loading your dashboard/i)).toBeInTheDocument();
  });

  it('redirects admin users to admin dashboard', async () => {
    // Mock admin auth state
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate
      };
    });

    vi.mocked(useAuth).mockReturnValue({
      userRole: 'admin',
      loading: false,
      user: { id: 'user1', email: 'admin@example.com' }
    });

    renderWithRoutes();

    // Should navigate to admin dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('redirects seller users to seller dashboard', async () => {
    // Mock seller auth state
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate
      };
    });

    vi.mocked(useAuth).mockReturnValue({
      userRole: 'seller',
      loading: false,
      user: { id: 'user2', email: 'seller@example.com' }
    });

    renderWithRoutes();

    // Should navigate to seller dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/seller/dashboard');
  });

  it('redirects buyer users to home page', async () => {
    // Mock buyer auth state
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate
      };
    });

    vi.mocked(useAuth).mockReturnValue({
      userRole: 'buyer',
      loading: false,
      user: { id: 'user3', email: 'buyer@example.com' }
    });

    renderWithRoutes();

    // Should navigate to home page
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
}); 