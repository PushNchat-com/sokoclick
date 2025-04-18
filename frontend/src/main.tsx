import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './i18n'
import './index.css'
import { supabaseHelper } from './api/supabase'

// Apply migrations when the app loads
const initApp = async () => {
  try {
    // Apply auction relations migration if needed
    const auctionMigration = await supabaseHelper.migrations.applyAuctionRelations()
    console.log(auctionMigration.message)
    
    // Apply role sync migration
    const roleSyncMigration = await supabaseHelper.migrations.applyRoleSync()
    console.log(roleSyncMigration.message)
    
    // Apply admin dashboard stats view migration
    const adminStatsMigration = await supabaseHelper.migrations.applyAdminDashboardStats()
    console.log(adminStatsMigration.message)
  } catch (error) {
    console.error('Error initializing app:', error)
  }
  
  // Render the app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Start initialization
initApp()
