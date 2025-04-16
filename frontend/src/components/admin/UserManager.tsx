import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import supabase from '../../api/supabase';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useToast } from '../../providers/ToastProvider';

// User type definition
interface User {
  id: string;
  email: string;
  role: 'admin' | 'seller' | 'buyer' | null;
  created_at: string;
  last_sign_in_at: string | null;
  display_name?: string;
}

const UserManager: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get all profiles from the profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;
      
      // Get all users from the auth.users view - this will require admin privileges
      const { data: authUsers, error: authError } = await supabase
        .from('auth_users_view') // This is a custom view that needs to be created in Supabase
        .select('id, email, created_at, last_sign_in_at, role');
      
      if (authError) {
        // Fallback to using just the profiles if auth view isn't available
        console.warn('Could not fetch auth users, using profiles data only', authError);
        const mappedUsers = profiles.map((profile) => ({
          id: profile.id,
          email: profile.email || 'Unknown email',
          role: profile.role || 'buyer',
          created_at: profile.created_at,
          last_sign_in_at: profile.last_sign_in || null,
          display_name: profile.display_name
        }));
        setUsers(mappedUsers);
      } else {
        // Merge auth users with profile data
        const mergedUsers = authUsers.map((authUser) => {
          const profile = profiles.find((p) => p.id === authUser.id) || {};
          return {
            ...authUser,
            display_name: profile.display_name
          };
        });
        setUsers(mergedUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      
      // For demo purposes, set mock users if there's an error
      setUsers(getMockUsers());
    } finally {
      setLoading(false);
    }
  };

  // Function to update a user's role
  const updateUserRole = async (userId: string, role: 'admin' | 'seller' | 'buyer') => {
    try {
      // Update the profile record
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
      
      toast.showToast(t('admin.userRoleUpdated', { role }), 'success');
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.showToast(t('admin.userRoleUpdateError'), 'error');
      
      // For demo purposes, update the role in local state anyway
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
    }
  };

  // Function to get mock users for demo purposes
  const getMockUsers = (): User[] => {
    return [
      {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        display_name: 'Admin User'
      },
      {
        id: '2',
        email: 'seller1@example.com',
        role: 'seller',
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        display_name: 'Seller One'
      },
      {
        id: '3',
        email: 'buyer1@example.com',
        role: 'buyer',
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        display_name: 'Buyer One'
      },
      {
        id: '4',
        email: 'buyer2@example.com',
        role: 'buyer',
        created_at: new Date().toISOString(),
        last_sign_in_at: null,
        display_name: 'Buyer Two'
      }
    ];
  };

  // Filter and search users
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesRole && matchesSearch;
  });

  // Render role badge
  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">{t('admin.role.admin')}</Badge>;
      case 'seller':
        return <Badge variant="success">{t('admin.role.seller')}</Badge>;
      case 'buyer':
        return <Badge variant="primary">{t('admin.role.buyer')}</Badge>;
      default:
        return <Badge variant="default">{t('admin.role.unknown')}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md my-4">
        <p className="font-bold">{t('admin.errorFetchingUsers')}:</p>
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-2" 
          onClick={fetchUsers}
        >
          {t('tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-medium mb-2 sm:mb-0">{t('admin.userManagement')}</h2>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <input
              type="text"
              className="border border-gray-300 rounded-md px-3 py-2 pr-8 w-full sm:w-60"
              placeholder={t('admin.searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute top-2.5 right-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">{t('admin.allRoles')}</option>
            <option value="admin">{t('admin.role.admin')}</option>
            <option value="seller">{t('admin.role.seller')}</option>
            <option value="buyer">{t('admin.role.buyer')}</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.user')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.role')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.joinedDate')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.display_name ? user.display_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.display_name || '(No name)'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {selectedUserId === user.id ? (
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => updateUserRole(user.id, 'admin')}
                        >
                          {t('admin.makeAdmin')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateUserRole(user.id, 'seller')}
                        >
                          {t('admin.makeSeller')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateUserRole(user.id, 'buyer')}
                        >
                          {t('admin.makeBuyer')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedUserId(null)}
                        >
                          {t('cancel')}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        {t('admin.changeRole')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    {t('admin.noUsersFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManager; 