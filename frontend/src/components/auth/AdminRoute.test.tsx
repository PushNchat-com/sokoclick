import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { UserRole } from "../../types/auth";

// Mock the auth context hook
jest.mock("../../contexts/UnifiedAuthContext");
const mockUseUnifiedAuth = useUnifiedAuth as jest.Mock;

describe("AdminRoute Component", () => {
  const AdminComponent = () => (
    <div data-testid="admin-content">Admin Content</div>
  );
  const AdminLoginPage = () => <div data-testid="admin-login">Admin Login</div>;
  const UnauthorizedPage = () => (
    <div data-testid="unauthorized-page">Unauthorized Page</div>
  );

  // Helper to setup the route with test components
  const renderWithRouter = (
    authState: any = {
      user: null,
      isAdmin: false,
      loading: false,
    },
  ) => {
    // Setup the mock auth context
    mockUseUnifiedAuth.mockReturnValue(authState);

    return render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminComponent />
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test("should show loading state when authentication is being verified", () => {
    renderWithRouter({ user: null, isAdmin: false, loading: true });

    // Assert loading state is shown
    expect(screen.getByText("Verifying admin access...")).toBeInTheDocument();
    // Admin content should not be visible
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  test("should redirect to admin login when user is not authenticated", () => {
    renderWithRouter({ user: null, isAdmin: false, loading: false });

    // Assert redirection occurred
    expect(screen.getByTestId("admin-login")).toBeInTheDocument();
    // Admin content should not be visible
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  test("should redirect to unauthorized page when user is authenticated but not admin", () => {
    renderWithRouter({
      user: { role: UserRole.CUSTOMER },
      isAdmin: false,
      loading: false,
    });

    // Assert redirection to unauthorized page
    expect(screen.getByTestId("unauthorized-page")).toBeInTheDocument();
    // Admin content should not be visible
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  test("should render children when user is admin", () => {
    renderWithRouter({
      user: { role: UserRole.SUPER_ADMIN },
      isAdmin: true,
      loading: false,
    });

    // Assert admin content is shown
    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
  });

  test("should redirect to unauthorized page when admin does not have required role", () => {
    // Setup test with specific required roles
    mockUseUnifiedAuth.mockReturnValue({
      user: { role: UserRole.CONTENT_MODERATOR },
      isAdmin: true,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute requiredRoles={[UserRole.SUPER_ADMIN]}>
                <AdminComponent />
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Assert redirection to unauthorized page
    expect(screen.getByTestId("unauthorized-page")).toBeInTheDocument();
    // Admin content should not be visible
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  test("should render children when admin has one of the required roles", () => {
    // Setup test with specific required roles
    mockUseUnifiedAuth.mockReturnValue({
      user: { role: UserRole.SUPER_ADMIN },
      isAdmin: true,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute
                requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
              >
                <AdminComponent />
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Assert admin content is shown
    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
  });

  test("should use custom redirect path when provided", () => {
    // Setup test with custom redirect path
    mockUseUnifiedAuth.mockReturnValue({
      user: null,
      isAdmin: false,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route
            path="/custom-login"
            element={<div data-testid="custom-login">Custom Login</div>}
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute redirectTo="/custom-login">
                <AdminComponent />
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Assert redirection to custom login page
    expect(screen.getByTestId("custom-login")).toBeInTheDocument();
  });

  test("should use custom fallback component when provided", () => {
    // Setup test with custom fallback
    mockUseUnifiedAuth.mockReturnValue({
      user: null,
      isAdmin: false,
      loading: true,
    });

    const CustomFallback = () => (
      <div data-testid="custom-fallback">Custom Loading...</div>
    );

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute fallback={<CustomFallback />}>
                <AdminComponent />
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Assert custom fallback is shown
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
  });
});
