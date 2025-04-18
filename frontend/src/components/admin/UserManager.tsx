import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabaseClient, fixUserRoleSync } from '../../api/supabase';
import { useToast } from '../../components/ui/Toast';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingState from '../ui/LoadingState';
import Modal from '../ui/Modal';
import { useRealtimeUsers, UserRecord } from '../../hooks/useRealtimeUsers';
import logger from '../../utils/logger';
import DiagnoseButton from './DiagnoseButton';
import AdminInitializer from './AdminInitializer';
import ManualFixTool from './ManualFixTool';

// User type definition
interface User {
  id: string;
  email: string;
  role: string;
  phone_number?: string;
  whatsapp_number?: string;
  language_preference?: string;
  location?: string;
  created_at: string;
  last_sign_in_at: string | null;
  display_name?: string;
}

interface EditUserFormData {
  email: string;
  role: 'admin' | 'seller' | 'buyer';
  phone_number: string;
  whatsapp_number: string;
  language_preference: string;
  display_name: string;
  location: string;
}

type SortColumn = 'email' | 'role' | 'created_at' | 'last_sign_in_at';
type SortOrder = 'asc' | 'desc';

// Add the log instance
const log = logger.child('UserManager');

// Fetch with retry utility
const fetchWithRetry = async <T,>(
  fetchFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      return await fetchFn();
    } catch (err) {
      lastError = err instanceof Error 
        ? err 
        : new Error(typeof err === 'string' ? err : 'Unknown error');
      
      retries++;
      
      if (retries >= maxRetries) break;
      
      // Exponential backoff: wait longer between each retry
      const delay = 1000 * Math.pow(2, retries - 1);
      console.log(`Retrying fetch (attempt ${retries}/${maxRetries}) after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
};

const UserManager: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { users: realtimeUsers, loading: realtimeLoading, error: realtimeError } = useRealtimeUsers();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'seller' | 'buyer'>('all');
  
  // Edit user modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserFormData>({
    email: '',
    role: 'buyer',
    phone_number: '',
    whatsapp_number: '',
    language_preference: 'en',
    display_name: '',
    location: ''
  });
  
  // Fetch users on component mount and when dependencies change
  useEffect(() => {
    if (realtimeUsers.length > 0) {
      log.info('Using realtime users data', { count: realtimeUsers.length });
      setUsers(realtimeUsers.map(user => ({
        id: user.id,
        email: user.email || '',
        role: user.role || 'buyer',
        phone_number: user.phone_number || '',
        whatsapp_number: user.whatsapp_number || '',
        language_preference: user.language_preference || 'en',
        location: user.location || '',
        created_at: user.created_at || new Date().toISOString(),
        last_sign_in_at: user.last_sign_in_at || null,
        display_name: user.display_name || ''
      })));
      setLoading(false);
    } else if (!realtimeLoading && realtimeError) {
      log.warn('Realtime users error, falling back to manual fetch', { error: realtimeError });
      fetchUsers(currentPage, itemsPerPage);
    }
  }, [realtimeUsers, realtimeLoading, realtimeError]);
  
  // Fetch users function with server-side pagination
  const fetchUsers = async (page = 1, pageSize = itemsPerPage) => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      await fetchWithRetry(async () => {
        // Build the query
        let query = supabaseClient
          .from('users')
          .select('*', { count: 'exact' })
          .order(sortColumn, { ascending: sortOrder === 'asc' })
          .range(from, to);
        
        // Apply role filter if not "all"
        if (roleFilter !== 'all') {
          query = query.eq('role', roleFilter);
        }
        
        // Apply search if present
        if (searchTerm) {
          query = query.or(`email.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`);
        }
        
        const { data, error: fetchError, count } = await query;
        
        if (fetchError) throw fetchError;
        
        // Transform data to match User interface
        const transformedUsers = data?.map(user => ({
          id: user.id,
          email: user.email || '',
          role: user.role || 'buyer',
          phone_number: user.phone_number || '',
          whatsapp_number: user.whatsapp_number || '',
          language_preference: user.language_preference || 'en',
          location: user.location || '',
          created_at: user.created_at || new Date().toISOString(),
          last_sign_in_at: user.last_sign_in_at || null,
          display_name: user.display_name || ''
        })) || [];
        
        setUsers(transformedUsers);
        setTotalCount(count || 0);
        
        if (transformedUsers.length === 0 && count && count > 0 && currentPage > 1) {
          // If we have results but current page is empty, go back one page
          setCurrentPage(prev => Math.max(prev - 1, 1));
        }
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      
      // In development, fallback to mock data
      if (!import.meta.env.PROD) {
        console.warn('Using mock data due to fetch error in development');
        const mockData = getMockUsers();
        setUsers(mockData);
        setTotalCount(mockData.length);
      }
      
      toast.error(t('admin.errorFetchingUsers'));
    } finally {
      setLoading(false);
    }
  };
  
  // Sort handling
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortColumn(column);
      setSortOrder('asc');
    }
    
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };
  
  // Display sort indicator
  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    
    return sortOrder === 'asc' 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };
  
  // Update user role
  const updateUserRole = async (userId: string, role: 'admin' | 'seller' | 'buyer') => {
    try {
      setLoading(true);
      log.info('Updating user role', { userId, role });
      
      // Use the RPC function directly to avoid RLS recursion issues
      const { error } = await supabaseClient.rpc('update_user_role', {
        user_id: userId,
        new_role: role
      });
      
      if (error) {
        log.error('Failed to update user role via RPC', { userId, role, error });
        throw error;
      }
      
      log.info('User role updated successfully', { userId, role });
      
      // With realtime updates, the local state will be updated automatically
      // Just show a success message
      toast.success(t('admin.roleUpdatedSuccess'));
      
      // Force refresh the users list after role update
      fetchUsers(currentPage, itemsPerPage);
    } catch (err) {
      console.error('Error updating user role:', err);
      log.error('Error updating user role', { userId, role, error: err });
      toast.error(t('admin.roleUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  // Edit user modal handlers
  const openEditModal = (user: User) => {
    setCurrentUser(user);
    setEditFormData({
      email: user.email,
      role: user.role || 'buyer',
      phone_number: user.phone_number || '',
      whatsapp_number: user.whatsapp_number || '',
      language_preference: user.language_preference || 'en',
      display_name: user.display_name || '',
      location: user.location || ''
    });
    setIsEditModalOpen(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const saveUserData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Check if the role has changed
      const roleChanged = currentUser.role !== editFormData.role;
      
      // If role changed, update it first using the dedicated function
      if (roleChanged) {
        log.info('Role change detected, updating role first', { 
          oldRole: currentUser.role, 
          newRole: editFormData.role,
          userId: currentUser.id
        });
        
        try {
          // Call the proper role update function that handles both tables
          await updateUserRole(currentUser.id, editFormData.role);
        } catch (roleError) {
          // If role update fails, abort the whole operation
          throw new Error(`Role update failed: ${roleError}`);
        }
      }
      
      // Update only fields that we know exist in the database
      // Removed display_name and any other potentially problematic fields
      const updateData = {
        email: editFormData.email,
        phone_number: editFormData.phone_number,
        whatsapp_number: editFormData.whatsapp_number,
        language_preference: editFormData.language_preference,
        location: editFormData.location
      };
      
      // Only include role in the update if it hasn't changed
      if (!roleChanged) {
        updateData['role'] = editFormData.role;
      }
      
      log.debug('Updating user data', { userId: currentUser.id, updateData });
      
      const { error } = await supabaseClient
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id);
      
      if (error) {
        log.error('Error updating user data', { error });
        throw error;
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === currentUser.id 
            ? { 
                ...user, 
                ...editFormData,
                // Ensure these fields remain unchanged
                id: user.id,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at
              } 
            : user
        )
      );
      
      toast.success(t('admin.userUpdatedSuccess'));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(t('admin.userUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  // Mock data for development fallback
  const getMockUsers = (): User[] => {
    return [
      {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
        display_name: 'Admin User',
        phone_number: '+1234567890',
        whatsapp_number: '+1234567890',
        language_preference: 'en',
        location: 'New York',
        created_at: '2023-01-01T00:00:00Z',
        last_sign_in_at: '2023-04-01T00:00:00Z'
      },
      {
        id: '2',
        email: 'seller@example.com',
        role: 'seller',
        display_name: 'Sample Seller',
        phone_number: '+0987654321',
        whatsapp_number: '+0987654321',
        language_preference: 'en',
        location: 'London',
        created_at: '2023-02-01T00:00:00Z',
        last_sign_in_at: '2023-04-02T00:00:00Z'
      },
      {
        id: '3',
        email: 'buyer@example.com',
        role: 'buyer',
        display_name: 'Sample Buyer',
        phone_number: '+1122334455',
        whatsapp_number: '',
        language_preference: 'fr',
        location: 'Paris',
        created_at: '2023-03-01T00:00:00Z',
        last_sign_in_at: '2023-04-03T00:00:00Z'
      }
    ];
  };
  
  // Handle page change for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  // Handle role filter change
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value as 'all' | 'admin' | 'seller' | 'buyer');
    setCurrentPage(1);
  };
  
  // Render role badge with appropriate styling
  const renderRoleBadge = (role: string) => {
    let badgeClass = 'px-2 py-1 rounded text-xs font-medium';
    
    switch (role) {
      case 'admin':
        badgeClass += ' bg-purple-100 text-purple-800';
        break;
      case 'seller':
        badgeClass += ' bg-blue-100 text-blue-800';
        break;
      case 'buyer':
        badgeClass += ' bg-green-100 text-green-800';
        break;
      default:
        badgeClass += ' bg-gray-100 text-gray-800';
    }
    
    return <span className={badgeClass}>{t(`roles.${role}`) || role}</span>;
  };
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Initialize admin functions */}
      <AdminInitializer />
      
      {/* Search and filters */}
      <div className="p-4 flex flex-wrap gap-4 border-b">
        <div className="flex-1 min-w-[250px]">
          <input 
            type="text" 
            placeholder={t('admin.searchUsers')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="w-48">
          <select
            value={roleFilter}
            onChange={handleRoleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">{t('admin.allRoles')}</option>
            <option value="admin">{t('roles.admin')}</option>
            <option value="seller">{t('roles.seller')}</option>
            <option value="buyer">{t('roles.buyer')}</option>
          </select>
        </div>
        
        <div>
          <Button onClick={() => fetchUsers(currentPage, itemsPerPage)}>
            {t('admin.refresh')}
          </Button>
        </div>
      </div>
      
      {/* Admin Tools */}
      <div className="px-4 py-2 border-b bg-gray-50">
        <h3 className="text-lg font-medium mb-2">Admin Tools</h3>
        <div className="flex flex-col gap-4">
          <DiagnoseButton />
          <ManualFixTool />
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-error-50 text-error-700 p-4 border-b border-error-200">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => fetchUsers(currentPage, itemsPerPage)}
          >
            {t('admin.retry')}
          </Button>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && users.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>{t('admin.noUsers')}</p>
        </div>
      )}
      
      {/* User table */}
      {!loading && users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  {t('admin.userInfo')} {getSortIndicator('email')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('role')}
                >
                  {t('admin.role')} {getSortIndicator('role')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  {t('admin.memberSince')} {getSortIndicator('created_at')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('last_sign_in_at')}
                >
                  {t('admin.lastLogin')} {getSortIndicator('last_sign_in_at')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.email}
                        </div>
                        {user.display_name && (
                          <div className="text-sm text-gray-500">
                            {user.display_name}
                          </div>
                        )}
                        {user.phone_number && (
                          <div className="text-xs text-gray-500">
                            {user.phone_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      {renderRoleBadge(user.role || 'buyer')}
                      
                      <select
                        value={user.role || 'buyer'}
                        onChange={(e) => {
                          const newRole = e.target.value as 'admin' | 'seller' | 'buyer';
                          // Use the fixed function instead of updateUserRole
                          fixUserRoleSync(user.id, newRole)
                            .then(success => {
                              if (success) {
                                toast.success(t('admin.roleUpdatedSuccess'));
                                // Update the local state
                                setUsers(prevUsers => 
                                  prevUsers.map(u => 
                                    u.id === user.id ? { ...u, role: newRole } : u
                                  )
                                );
                              } else {
                                toast.error(t('admin.roleUpdateFailed'));
                              }
                            });
                        }}
                        className="text-sm border border-gray-300 rounded p-1"
                        disabled={loading}
                      >
                        <option value="buyer">{t('roles.buyer')}</option>
                        <option value="seller">{t('roles.seller')}</option>
                        <option value="admin">{t('roles.admin')}</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleDateString() 
                      : t('admin.never')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      {t('admin.edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t('admin.showing')} <span className="font-medium">{totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span>{' '}
                {t('admin.to')}{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{' '}
                {t('admin.of')} <span className="font-medium">{totalCount}</span>{' '}
                {t('admin.results')}
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.previous')}</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum: number;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.next')}</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {isEditModalOpen && currentUser && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          
          <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6 shadow-xl">
            <h3 className="text-lg font-medium mb-4">{t('admin.editUser')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.displayName')}</label>
                <input
                  type="text"
                  name="display_name"
                  value={editFormData.display_name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.role')}</label>
                <select
                  name="role"
                  value={editFormData.role}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="buyer">{t('roles.buyer')}</option>
                  <option value="seller">{t('roles.seller')}</option>
                  <option value="admin">{t('roles.admin')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.phoneNumber')}</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={editFormData.phone_number}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.whatsappNumber')}</label>
                <input
                  type="tel"
                  name="whatsapp_number"
                  value={editFormData.whatsapp_number}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.language')}</label>
                <select
                  name="language_preference"
                  value={editFormData.language_preference}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="en">{t('languages.en')}</option>
                  <option value="fr">{t('languages.fr')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.location')}</label>
                <input
                  type="text"
                  name="location"
                  value={editFormData.location}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={saveUserData}
                disabled={loading}
              >
                {loading ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager; 