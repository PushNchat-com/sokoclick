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
import AdminDashboard from './pages/AdminDashboard';
import WhatsAppDashboard from './pages/WhatsAppDashboard';
import DesignSystem from './pages/DesignSystem';

// Admin pages (import as needed)
const SellerDashboard = () => <div>Seller Dashboard (Coming Soon)</div>;

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
  // Protected admin routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  // Protected seller routes
  {
    path: '/seller',
    element: (
      <ProtectedRoute requiredRole="seller">
        <SellerDashboard />
      </ProtectedRoute>
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
  // Design system documentation
  {
    path: '/design-system',
    element: <DesignSystem />,
  },
]);

export default router; 