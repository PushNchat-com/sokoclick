import React, { useState } from 'react';
import Button from '../ui/Button';
import { runDiagnosticScript, fixUserRoleSync } from '../../api/supabase';
import { useToast } from '../ui/Toast';

// Define an interface for role data
interface RoleData {
  id: string;
  email: string;
  users_role: string;
  auth_role: string;
  is_synced: boolean;
}

const DiagnoseButton: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [roleData, setRoleData] = useState<RoleData[]>([]);
  const [visible, setVisible] = useState(false);
  const toast = useToast();

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const result = await runDiagnosticScript();
      setResults(result);
      setVisible(true);
      
      // Process the returned data
      if (result.success && result.data) {
        console.log('Diagnostic data:', result.data);
        
        // Try to parse the data based on its structure
        let parsedRoles: RoleData[] = [];
        
        // Check if data is an array directly
        if (Array.isArray(result.data)) {
          parsedRoles = result.data.map((item: any) => {
            // Extract the role data from whatever format it's in
            if (item.id && item.email) {
              // Direct format from simple SQL query
              return {
                id: item.id,
                email: item.email,
                users_role: item.users_role || 'null',
                auth_role: item.auth_role || 'null',
                is_synced: item.is_synced || false
              };
            } else if (item.role && Array.isArray(item.role)) {
              // Handle nested role array if that's the format
              return item.role.map((role: any) => ({
                id: role.id,
                email: role.email,
                users_role: role.users_role || 'null',
                auth_role: role.auth_role || 'null',
                is_synced: role.is_synced || false
              }));
            }
            return null;
          }).filter(Boolean).flat();
        } else if (result.data.role && Array.isArray(result.data.role)) {
          // If data.role is an array
          parsedRoles = result.data.role.map((role: any) => ({
            id: role.id,
            email: role.email,
            users_role: role.users_role || 'null',
            auth_role: role.auth_role || 'null',
            is_synced: role.is_synced || false
          }));
        }
        
        setRoleData(parsedRoles);
      }
      
      if (!result.success) {
        toast.error(`Diagnostic failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error running diagnostic:', error);
      toast.error('Failed to run diagnostic');
    } finally {
      setIsRunning(false);
    }
  };

  const fixUserRole = async (userId: string, role: string) => {
    try {
      const success = await fixUserRoleSync(userId, role);
      if (success) {
        toast.success(`Fixed role for user ${userId}`);
        // Refresh the diagnostic
        runDiagnostic();
      } else {
        toast.error(`Failed to fix role for user ${userId}`);
      }
    } catch (error) {
      console.error('Error fixing user role:', error);
      toast.error('Failed to fix user role');
    }
  };

  return (
    <div className="mb-4">
      <Button 
        onClick={runDiagnostic}
        disabled={isRunning}
        variant="outline"
      >
        {isRunning ? 'Running...' : 'Diagnose User Roles'}
      </Button>
      
      {visible && results && (
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Diagnostic Results</h3>
            <button 
              onClick={() => setVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          {results.success ? (
            <div>
              <p className="text-green-600 mb-2">Diagnostic completed successfully</p>
              
              {roleData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users Table Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth Table Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Synced</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {roleData.map((role) => (
                        <tr key={role.id} className={!role.is_synced ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{role.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{role.users_role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{role.auth_role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {role.is_synced ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!role.is_synced && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => fixUserRole(role.id, role.users_role)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Sync to Users
                                </button>
                                <button
                                  onClick={() => fixUserRole(role.id, role.auth_role)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Sync to Auth
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  <p>No mismatched role data found.</p>
                  <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(results.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600">
              <p>Diagnostic failed: {results.message}</p>
              {results.error && (
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(results.error, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnoseButton; 