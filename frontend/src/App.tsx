import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { Suspense, useEffect, useState } from 'react'
import './utils/i18n'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { WhatsAppProvider } from './context/WhatsAppContext'
import { initializeSupabaseResources } from './utils/initSupabase'

function App() {
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Initialize Supabase resources on app load
  useEffect(() => {
    const initializeResources = async () => {
      try {
        // Initialize all required Supabase resources
        const result = await initializeSupabaseResources();
        
        setStorageInitialized(result.success);
        
        if (!result.success) {
          console.warn('Supabase resources initialization warning:', result.message);
          setStorageError(result.message);
        } else {
          console.log('Supabase resources initialized successfully:', result.messages.join(', '));
        }
      } catch (error: any) {
        console.error('Failed to initialize Supabase resources:', error);
        setStorageError(error.message || 'Unknown error initializing resources');
      }
    };

    initializeResources();
  }, []);

  // Handle redirect from 404.html
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      // Use history.replaceState to update the URL without causing a page reload
      window.history.replaceState(null, '', redirectPath);
    }
  }, []);

  // Show storage error if initialization failed
  if (storageError) {
    console.warn('App continuing despite resource initialization error');
    // We're not blocking the app from loading, just logging the error
  }

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary-600 border-r-primary-300 border-b-primary-200 border-l-primary-100"></div>
      </div>
    }>
      <AuthProvider>
        <ToastProvider>
          <WhatsAppProvider>
            <RouterProvider router={router} />
          </WhatsAppProvider>
        </ToastProvider>
      </AuthProvider>
    </Suspense>
  )
}

export default App
