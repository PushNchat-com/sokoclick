import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { UserRole } from '../../types/auth';

// Mock the auth context hook
jest.mock('../../contexts/UnifiedAuthContext');
const mockUseUnifiedAuth = useUnifiedAuth as jest.Mock;

describe('PrivateRoute Component', () => {
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;
  const LoginPage = () => <div data-testid="login-page">Login Page</div>;
  const UnauthorizedPage = () => <div data-testid="unauthorized-page">Unauthorized Page</div>;
  
  // Helper to setup the route with test components
  const renderWithRouter = (
    authState: any = { 
      user: null, 
      isAuthenticated: false, 
      loading: false 
    }
  ) => {
    // Setup the mock auth context
    mockUseUnifiedAuth.mockReturnValue(authState);
    
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route 
            path="/protected" 
            element={
              <PrivateRoute>
                <TestComponent />
              </PrivateRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should show loading state when authentication is being verified', () => {
    renderWithRouter({ user: null, isAuthenticated: false, loading: true });
    
    // Assert loading state is shown
    expect(screen.getByText('Verifying access...')).toBeInTheDocument();
    // Protected content should not be visible
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('should redirect to login when user is not authenticated', () => {
    renderWithRouter({ user: null, isAuthenticated: false, loading: false });
    
    // Assert redirection occurred
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    // Protected content should not be visible
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('should render children when user is authenticated', () => {
    renderWithRouter({ 
      user: { role: UserRole.CUSTOMER }, 
      isAuthenticated: true, 
      loading: false 
    });
    
    // Assert protected content is shown
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('should redirect to unauthorized page when user does not have required role', () => {
    // Setup test with specific required roles
    mockUseUnifiedAuth.mockReturnValue({ 
      user: { role: UserRole.CUSTOMER }, 
      isAuthenticated: true, 
      loading: false 
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route 
            path="/protected" 
            element={
              <PrivateRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                <TestComponent />
              </PrivateRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Assert redirection to unauthorized page
    expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
    // Protected content should not be visible
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('should render children when user has one of the required roles', () => {
    // Setup test with specific required roles
    mockUseUnifiedAuth.mockReturnValue({ 
      user: { role: UserRole.ADMIN }, 
      isAuthenticated: true, 
      loading: false 
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route 
            path="/protected" 
            element={
              <PrivateRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                <TestComponent />
              </PrivateRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Assert protected content is shown
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('should use custom redirect path when provided', () => {
    // Setup test with custom redirect path
    mockUseUnifiedAuth.mockReturnValue({ 
      user: null, 
      isAuthenticated: false, 
      loading: false 
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/custom-login" element={<div data-testid="custom-login">Custom Login</div>} />
          <Route 
            path="/protected" 
            element={
              <PrivateRoute redirectTo="/custom-login">
                <TestComponent />
              </PrivateRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Assert redirection to custom login page
    expect(screen.getByTestId('custom-login')).toBeInTheDocument();
  });

  test('should use custom fallback component when provided', () => {
    // Setup test with custom fallback
    mockUseUnifiedAuth.mockReturnValue({ 
      user: null, 
      isAuthenticated: false, 
      loading: true 
    });
    
    const CustomFallback = () => <div data-testid="custom-fallback">Custom Loading...</div>;
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <PrivateRoute fallback={<CustomFallback />}>
                <TestComponent />
              </PrivateRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    // Assert custom fallback is shown
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });
}); 