import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import AuctionDetail from './pages/AuctionDetail';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminDashboard from './pages/admin/Dashboard';
import WhatsAppDashboard from './pages/WhatsAppDashboard';
import DesignSystem from './pages/DesignSystem';
import SellerDashboard from './pages/seller/Dashboard';
import Dashboard from './pages/Dashboard';
import Game from './pages/Game';
import SupabaseTest from './pages/SupabaseTest';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';

// Admin pages (import as needed)
// const SellerDashboard = () => <div>Seller Dashboard (Coming Soon)</div>;

// Admin route guard component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      navigate('/unauthorized?role=admin');
    }
  }, [user, loading, userRole, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary-600 border-r-primary-300 border-b-primary-200 border-l-primary-100"></div>
      </div>
    );
  }

  return user && userRole === 'admin' ? (
    <>{children}</>
  ) : null;
};

// Seller route guard component
const SellerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || (userRole !== 'seller' && userRole !== 'admin'))) {
      navigate('/unauthorized?role=seller');
    }
  }, [user, loading, userRole, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary-600 border-r-primary-300 border-b-primary-200 border-l-primary-100"></div>
      </div>
    );
  }

  return user && (userRole === 'seller' || userRole === 'admin') ? (
    <>{children}</>
  ) : null;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <NotFound />,
  },
  {
    path: '/sc/:slotId',
    element: <AuctionDetail />,
  },
  // Authentication routes
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  // Dashboard router - redirects to appropriate dashboard based on role
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  // Protected admin routes
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <Navigate to="/admin/dashboard" replace />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  // Add the missing admin routes
  {
    path: '/admin/users',
    element: (
      <AdminRoute>
        <AdminDashboard key="users" defaultTab="users" />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/auctions',
    element: (
      <AdminRoute>
        <AdminDashboard key="auctions" defaultTab="auctions" />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/transactions',
    element: (
      <AdminRoute>
        <AdminDashboard key="transactions" defaultTab="transactions" />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <AdminRoute>
        <AdminDashboard key="settings" defaultTab="settings" />
      </AdminRoute>
    ),
  },
  // Protected seller routes
  {
    path: '/seller/dashboard',
    element: (
      <SellerRoute>
        <SellerDashboard />
      </SellerRoute>
    ),
  },
  // WhatsApp dashboard
  {
    path: '/messages',
    element: (
      <ProtectedRoute>
        <WhatsAppDashboard />
      </ProtectedRoute>
    ),
  },
  // Sokoclick game
  {
    path: '/game',
    element: <Game />,
  },
  // Supabase integration test
  {
    path: '/supabase-test',
    element: <SupabaseTest />,
  },
  // Design system documentation
  {
    path: '/design-system',
    element: <DesignSystem />,
  },
]);

export default router; 