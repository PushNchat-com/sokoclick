import React, { Suspense, lazy, ComponentType } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { LanguageProvider } from "./store/LanguageContext";
import { UnifiedAuthProvider } from "./contexts/UnifiedAuthContext";
import { HelmetProvider } from "react-helmet-async";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import AuthErrorBoundary from "./components/auth/AuthErrorBoundary";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminRoute from "./components/auth/AdminRoute";
import { toast } from "./utils/toast";

// Lazy-loaded components with proper typing
const HomePage = lazy(() => import("./pages/HomePage")) as ComponentType;
const ProductPage = lazy(() => import("./pages/ProductPage")) as ComponentType;
const AdminDashboard = lazy(
  () => import("./pages/AdminDashboard"),
) as ComponentType;
const Dashboard = lazy(() => import("./pages/Dashboard")) as ComponentType;
const Profile = lazy(() => import("./pages/Profile")) as ComponentType;
// const AdminProductsPage = lazy(
//   () => import("./pages/AdminProductsPage"),
// ) as ComponentType;

// New pages
const AboutPage = lazy(() => import("./pages/AboutPage")) as ComponentType;
const FaqPage = lazy(() => import("./pages/FaqPage")) as ComponentType;
const HowItWorksPage = lazy(
  () => import("./pages/HowItWorksPage"),
) as ComponentType;
const SlotUploadsPage = lazy(
  () => import("./pages/admin/SlotUploadsPage"),
) as ComponentType;
const CreateProductDraftPage = lazy(
  () => import("./pages/admin/CreateProductDraftPage"),
) as ComponentType;

// Auth Components - these are smaller and can be imported directly
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";

// Admin Components
import UserManagement from "./components/admin/UserManagement";
import SlotManagement from "./components/admin/SlotManagement";
// import ProductForm from "./components/admin/ProductForm"; // Removed as per Option A

// Admin Auth Components
import AdminLogin from "./components/auth/AdminLogin";

// Loading Fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4 mx-auto"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Error Pages
const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
    <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
    <a
      href="/"
      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
    >
      Return to Home
    </a>
  </div>
);

const UnauthorizedPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <h1 className="text-4xl font-bold text-gray-800 mb-2">Unauthorized</h1>
    <p className="text-xl text-gray-600 mb-8">
      You don't have permission to access this page
    </p>
    <a
      href="/"
      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
    >
      Return to Home
    </a>
  </div>
);

const AdminUnauthorizedPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <h1 className="text-4xl font-bold text-gray-800 mb-2">
      Admin Access Required
    </h1>
    <p className="text-xl text-gray-600 mb-8">
      You need admin privileges to access this page
    </p>
    <div className="flex space-x-4">
      <a
        href="/admin/login"
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Admin Login
      </a>
      <a
        href="/"
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Return to Home
      </a>
    </div>
  </div>
);

// Define the App component
const App: React.FC = () => {
  return (
    <ErrorBoundary componentName="App">
      <HelmetProvider>
        <LanguageProvider>
          <UnifiedAuthProvider>
            <Router>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* User Routes */}
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route
                      path="login"
                      element={
                        <AuthErrorBoundary>
                          <Login />
                        </AuthErrorBoundary>
                      }
                    />
                    <Route path="signup" element={<Signup />} />
                    <Route
                      path="forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route path="reset-password" element={<ResetPassword />} />
                    {/* New public pages */}
                    <Route path="about" element={<AboutPage />} />
                    <Route path="faq" element={<FaqPage />} />
                    <Route path="how-it-works" element={<HowItWorksPage />} />
                    <Route
                      path="dashboard"
                      element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="profile"
                      element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      }
                    />
                    <Route path="product/:id" element={<ProductPage />} />
                  </Route>

                  {/* Admin login - standalone route */}
                  <Route
                    path="/admin/login"
                    element={
                      <AuthErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                          <AdminLogin />
                        </Suspense>
                      </AuthErrorBoundary>
                    }
                  />

                  {/* Admin Routes with AdminRoute protection */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="slots" element={<SlotManagement />} />
                    <Route path="slots/uploads" element={<SlotUploadsPage />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="products/create" element={<CreateProductDraftPage />} />
                    {/* <Route path="products" element={<AdminProductsPage />} /> */}
                    {/* Removed ProductForm routes as per Option A */}
                    {/* <Route
                      path="products/:id/edit"
                      element={<ProductForm isEditing />}
                    /> */}
                    {/* <Route
                      path="products/new"
                      element={<Navigate to="/admin/products/create" replace />}
                    /> */}
                    {/* <Route
                      path="products/:id/edit"
                      element={<ProductForm isEditing />}
                    /> */}
                  </Route>

                  {/* Error Pages */}
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route
                    path="/admin/unauthorized"
                    element={<AdminUnauthorizedPage />}
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </Router>
          </UnifiedAuthProvider>
        </LanguageProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

// Global unhandled error handler
window.addEventListener("error", (event) => {
  console.error("Unhandled error:", event.error);
  // Display a toast for unhandled errors in production
  if (process.env.NODE_ENV === "production") {
    toast.error(
      "An unexpected error occurred. Please try again or contact support if the problem persists.",
    );
  }
});

// Global unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Display a toast for unhandled promise rejections in production
  if (process.env.NODE_ENV === "production") {
    toast.error(
      "An unexpected error occurred. Please try again or contact support if the problem persists.",
    );
  }
});

// Explicit default export
export default App;
