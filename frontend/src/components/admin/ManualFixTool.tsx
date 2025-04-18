import React, { useState } from 'react';
import Button from '../ui/Button';
import { supabaseClient } from '../../api/supabase';
import { useToast } from '../ui/Toast';

/**
 * Component that provides direct manual fixes for known problematic users
 */
const ManualFixTool: React.FC = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const toast = useToast();

  // Fix for specifically known problematic user
  const fixCelineAccount = async () => {
    setIsFixing(true);
    setResult(null);
    
    try {
      const userId = '6120c421-eec6-40eb-93b1-d4add830089b'; // mng.celine@gmail.com
      const role = 'seller';
      
      console.log(`Manually fixing user ${userId} to role ${role}`);
      
      // Direct SQL update using RPC to bypass any RLS issues
      const fixSql = `
        -- Update both tables directly with bypass
        UPDATE public.users SET role = '${role}' WHERE id = '${userId}';
        
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{role}',
          '"${role}"'
        )
        WHERE id = '${userId}';
      `;
      
      const { error } = await supabaseClient.rpc('pgsql', { query: fixSql });
      
      if (error) {
        console.error('Manual fix failed:', error);
        setResult(`Error: ${error.message}`);
        toast.error(`Manual fix failed: ${error.message}`);
      } else {
        console.log('Manual fix succeeded');
        setResult('Fixed successfully! Refresh the page to see changes.');
        toast.success('Fixed mng.celine@gmail.com role to seller!');
      }
    } catch (error: any) {
      console.error('Error during manual fix:', error);
      setResult(`Error: ${error.message || 'Unknown error'}`);
      toast.error('Manual fix failed');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium mb-2">Manual Fix Tool</h3>
      <div className="flex space-x-2">
        <Button 
          onClick={fixCelineAccount}
          disabled={isFixing}
          variant="outline"
          className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
        >
          {isFixing ? 'Fixing...' : 'Fix mng.celine@gmail.com'}
        </Button>
      </div>
      
      {result && (
        <div className={`mt-2 p-2 rounded text-sm ${
          result.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {result}
        </div>
      )}
    </div>
  );
};

export default ManualFixTool; 