import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabaseClient } from '../../lib/supabase';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useToast } from '../ui/Toast';
import LoadingState from '../ui/LoadingState';
import Modal from '../ui/Modal';

// User type definition
interface User {
  id: string;
  email: string;
  role: 'admin' | 'seller' | 'buyer' | null;
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

const UserManager: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<EditUserFormData>({
    email: '',
    role: 'buyer',
    phone_number: '',
    whatsapp_number: '',
    language_preference: 'en',
    display_name: '',
    location: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [sortColumn, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get all users from the users table instead of profiles
      const query = supabaseClient
        .from('users')
        .select('*');
        
      // Apply sorting
      query.order(sortColumn, { ascending: sortOrder === 'asc' });
      
      const { data, error: usersError } = await query;
      
      if (usersError) throw usersError;
      
      // Map the data to our User type
      const transformedUsers = data?.map(user => ({
        id: user.id,
        email: user.email || '',
        role: user.role || 'buyer',
        phone_number: user.phone_number || '',
        whatsapp_number: user.whatsapp_number || '',
        language_preference: user.language_preference || 'en',
        location: user.location || '',
        created_at: user.created_at || new Date().toISOString(),
        last_sign_in_at: user.last_login || null,
        display_name: user.display_name || ''
      })) || [];
      
      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      
      // For demo/testing purposes only
      if (process.env.NODE_ENV !== 'production') {
        setUsers(getMockUsers());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: SortColumn) => {
    // If clicking the same column, toggle the sort order
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new column, set it as the sort column with default desc order
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  // Get sorting indicator
  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Function to update a user's role
  const updateUserRole = async (userId: string, role: 'admin' | 'seller' | 'buyer') => {
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
      
      toast.success(t('admin.userRoleUpdated', { role }));
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.error(t('admin.userRoleUpdateError'));
    }
  };

  // Function to handle editing a user
  const handleEditUser = useCallback((user: User) => {
    setSelectedUserId(user.id);
    setEditUserData({
      email: user.email || '',
      role: user.role || 'buyer',
      phone_number: user.phone_number || '',
      whatsapp_number: user.whatsapp_number || '',
      language_preference: user.language_preference || 'en',
      display_name: user.display_name || '',
      location: user.location || ''
    });
    setIsEditModalOpen(true);
  }, []);

  // Function to save edited user data
  const saveUserData = async () => {
    if (!selectedUserId) return;
    
    setSubmitLoading(true);
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({
          role: editUserData.role,
          phone_number: editUserData.phone_number,
          whatsapp_number: editUserData.whatsapp_number,
          language_preference: editUserData.language_preference,
          location: editUserData.location,
          // Note: display_name is not in the users table schema
        })
        .eq('id', selectedUserId);

      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUserId 
          ? { 
              ...user, 
              role: editUserData.role,
              phone_number: editUserData.phone_number,
              whatsapp_number: editUserData.whatsapp_number,
              language_preference: editUserData.language_preference,
              location: editUserData.location,
              display_name: editUserData.display_name
            } 
          : user
      ));
      
      setIsEditModalOpen(false);
      toast.success(t('admin.userUpdatedSuccess'));
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(t('admin.userUpdateError'));
    } finally {
      setSubmitLoading(false);
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
        display_name: 'Admin User',
        phone_number: '+1234567890',
        whatsapp_number: '+1234567890',
        language_preference: 'en',
        location: 'New York'
      },
      {
        id: '2',
        email: 'seller1@example.com',
        role: 'seller',
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        display_name: 'Seller One',
        phone_number: '+0987654321',
        whatsapp_number: '+0987654321',
        language_preference: 'fr',
        location: 'Paris'
      },
      {
        id: '3',
        email: 'buyer1@example.com',
        role: 'buyer',
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        display_name: 'Buyer One',
        phone_number: '+1122334455',
        whatsapp_number: '+1122334455',
        language_preference: 'en',
        location: 'London'
      },
      {
        id: '4',
        email: 'buyer2@example.com',
        role: 'buyer',
        created_at: new Date().toISOString(),
        last_sign_in_at: null,
        display_name: 'Buyer Two',
        phone_number: '+5566778899',
        whatsapp_number: '+5566778899',
        language_preference: 'fr',
        location: 'Montreal'
      }
    ];
  };

  // Filter users based on role and search term
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = searchTerm === '' || 
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.whatsapp_number && user.whatsapp_number.includes(searchTerm));
    
    return matchesRole && matchesSearch;
  });

  // Get paginated users
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Function to handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Function to render role badge based on user role
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge color="primary">{t('roles.admin')}</Badge>;
      case 'seller':
        return <Badge color="success">{t('roles.seller')}</Badge>;
      case 'buyer':
        return <Badge color="secondary">{t('roles.buyer')}</Badge>;
      default:
        return <Badge color="info">{t('roles.unknown')}</Badge>;
    }
  };

  if (loading) {
    return <LoadingState message={t('admin.loadingUsers')} />;
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
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">{t('admin.manageUsers')}</h3>
          <p className="text-sm text-gray-500">{t('admin.manageUsersDescription')}</p>
        </div>
        
        <div className="flex space-x-2 items-start">
          <select
            className="block border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">{t('admin.allRoles')}</option>
            <option value="admin">{t('roles.admin')}</option>
            <option value="seller">{t('roles.seller')}</option>
            <option value="buyer">{t('roles.buyer')}</option>
          </select>
          
          <div className="relative">
            <input
              type="text"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder={t('admin.searchUsers')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={fetchUsers}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        {loading ? (
          <LoadingState message={t('admin.loadingUsers')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    {t('admin.userInfo')}
                    {getSortIndicator('email')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    {t('admin.role')}
                    {getSortIndicator('role')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    {t('admin.memberSince')}
                    {getSortIndicator('created_at')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('last_sign_in_at')}
                  >
                    {t('admin.lastLogin')}
                    {getSortIndicator('last_sign_in_at')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || roleFilter !== 'all' 
                        ? t('admin.noMatchingUsers') 
                        : t('admin.noUsers')}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {user.display_name ? user.display_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.display_name || t('admin.noDisplayName')}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderRoleBadge(user.role || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : t('admin.neverLoggedIn')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            {t('admin.edit')}
                          </Button>
                          <div className="relative">
                            <select
                              className="appearance-none border border-gray-300 rounded-md text-sm py-1 pr-8 pl-2 bg-white"
                              value={user.role || ''}
                              onChange={(e) => {
                                const newRole = e.target.value as 'admin' | 'seller' | 'buyer';
                                if (newRole !== user.role) {
                                  if (window.confirm(t('admin.confirmRoleChange', { role: newRole }))) {
                                    updateUserRole(user.id, newRole);
                                  }
                                }
                              }}
                            >
                              <option value="buyer">{t('admin.role.buyer')}</option>
                              <option value="seller">{t('admin.role.seller')}</option>
                              <option value="admin">{t('admin.role.admin')}</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
          <div className="flex flex-1 justify-between sm:hidden">
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
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t('admin.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
                {t('admin.to')}{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                </span>{' '}
                {t('admin.of')} <span className="font-medium">{filteredUsers.length}</span>{' '}
                {t('admin.results')}
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label={t('admin.usermanager.pagination')}>
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:outline-offset-0'
                  }`}
                >
                  <span className="sr-only">{t('common.previous')}</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show at most 5 page buttons
                  let pageNum;
                  if (totalPages <= 5) {
                    // If 5 or fewer pages, show all
                    pageNum = i + 1;
                  } else {
                    // Calculate which pages to show
                    if (currentPage <= 3) {
                      // At the beginning, show 1-5
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // At the end, show last 5
                      pageNum = totalPages - 4 + i;
                    } else {
                      // In the middle, show current and 2 on each side
                      pageNum = currentPage - 2 + i;
                    }
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:outline-offset-0'
                  }`}
                >
                  <span className="sr-only">{t('common.next')}</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('admin.editUser')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.email')}
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={editUserData.email}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">{t('admin.emailCannotBeChanged')}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.displayName')}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={editUserData.display_name}
              onChange={(e) => setEditUserData({ ...editUserData, display_name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.role')}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={editUserData.role}
              onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value as 'admin' | 'seller' | 'buyer' })}
            >
              <option value="buyer">{t('admin.role.buyer')}</option>
              <option value="seller">{t('admin.role.seller')}</option>
              <option value="admin">{t('admin.role.admin')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.phoneNumber')}
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={editUserData.phone_number}
              onChange={(e) => setEditUserData({ ...editUserData, phone_number: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.whatsappNumber')}
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={editUserData.whatsapp_number}
              onChange={(e) => setEditUserData({ ...editUserData, whatsapp_number: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.language')}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={editUserData.language_preference}
              onChange={(e) => setEditUserData({ ...editUserData, language_preference: e.target.value })}
            >
              <option value="en">{t('languages.english')}</option>
              <option value="fr">{t('languages.french')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.location')}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={editUserData.location}
              onChange={(e) => setEditUserData({ ...editUserData, location: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={submitLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={saveUserData}
              disabled={submitLoading}
              isLoading={submitLoading}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManager; 