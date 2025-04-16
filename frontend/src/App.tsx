import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { Suspense } from 'react'
import './utils/i18n'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './providers/ToastProvider'

function App() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary-600 border-r-primary-300 border-b-primary-200 border-l-primary-100"></div>
      </div>
    }>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </Suspense>
  )
}

export default App
