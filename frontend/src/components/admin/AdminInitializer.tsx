import React, { useEffect, useState } from 'react';
import { applyMigrations, createRoleAccessFunctions } from '../../api/supabase';

/**
 * Component that runs initialization processes needed for the admin dashboard
 * Invisible component that runs in the background
 */
const AdminInitializer: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    const initializeAdmin = async () => {
      if (initialized) return;
      
      console.log('Initializing admin dashboard...');
      
      try {
        // Apply database migrations
        const migrationsResult = await applyMigrations();
        console.log('Migrations result:', migrationsResult);
        
        // Create role access functions
        const roleAccessResult = await createRoleAccessFunctions();
        console.log('Role access functions result:', roleAccessResult);
        
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing admin dashboard:', error);
      }
    };
    
    initializeAdmin();
  }, [initialized]);
  
  // This component doesn't render anything
  return null;
};

export default AdminInitializer; 