import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../store/LanguageContext';

interface User {
  id: string;
  name: string;
  whatsappNumber: string;
  email: string | null;
  location: string;
  isVerified: boolean;
  verificationLevel: 'basic' | 'complete' | null;
  verificationDate: string | null;
  joinedDate: string;
  productCount: number;
}

const UserManagement: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);
  
  // Text content
  const text = {
    userManagement: { en: 'User Management', fr: 'Gestion des utilisateurs' },
    searchUsers: { en: 'Search users...', fr: 'Rechercher des utilisateurs...' },
    allUsers: { en: 'All Users', fr: 'Tous les utilisateurs' },
    verifiedUsers: { en: 'Verified Users', fr: 'Utilisateurs vérifiés' },
    unverifiedUsers: { en: 'Unverified Users', fr: 'Utilisateurs non vérifiés' },
    name: { en: 'Name', fr: 'Nom' },
    whatsapp: { en: 'WhatsApp', fr: 'WhatsApp' },
    location: { en: 'Location', fr: 'Emplacement' },
    products: { en: 'Products', fr: 'Produits' },
    status: { en: 'Status', fr: 'Statut' },
    joined: { en: 'Joined', fr: 'Inscrit le' },
    actions: { en: 'Actions', fr: 'Actions' },
    verified: { en: 'Verified', fr: 'Vérifié' },
    unverified: { en: 'Unverified', fr: 'Non vérifié' },
    verify: { en: 'Verify', fr: 'Vérifier' },
    viewDetails: { en: 'View Details', fr: 'Voir les détails' },
    noUsers: { en: 'No users found', fr: 'Aucun utilisateur trouvé' },
    addUser: { en: 'Add User', fr: 'Ajouter un utilisateur' },
    basic: { en: 'Basic', fr: 'Basique' },
    complete: { en: 'Complete', fr: 'Complet' },
  };
  
  // Simulated API call to get users
  useEffect(() => {
    setTimeout(() => {
      // Mock user data
      const mockUsers: User[] = Array.from({ length: 15 }, (_, i) => ({
        id: `user-${i + 1}`,
        name: `User ${i + 1}`,
        whatsappNumber: `+237612345${i.toString().padStart(3, '0')}`,
        email: i % 3 === 0 ? `user${i + 1}@example.com` : null,
        location: i % 2 === 0 ? 'Douala' : 'Yaoundé',
        isVerified: i % 3 === 0,
        verificationLevel: i % 3 === 0 ? (i % 2 === 0 ? 'complete' : 'basic') : null,
        verificationDate: i % 3 === 0 ? new Date(Date.now() - (i * 86400000)).toISOString() : null,
        joinedDate: new Date(Date.now() - ((i + 10) * 86400000)).toISOString(),
        productCount: Math.floor(Math.random() * 5)
      }));
      
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Handle search
  useEffect(() => {
    let result = users;
    
    // Apply search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        user => 
          user.name.toLowerCase().includes(searchLower) || 
          user.whatsappNumber.includes(searchTerm) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          user.location.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply verification filter
    if (filterVerified !== null) {
      result = result.filter(user => user.isVerified === filterVerified);
    }
    
    setFilteredUsers(result);
  }, [searchTerm, filterVerified, users]);
  
  // Format date to local string
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">{t(text.userManagement)}</h2>
      </div>
      
      {/* Search and filter controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder={t(text.searchUsers)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 px-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex">
            <button
              onClick={() => setFilterVerified(null)}
              className={`px-4 py-2 text-sm font-medium ${
                filterVerified === null 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } border rounded-l-md`}
            >
              {t(text.allUsers)}
            </button>
            <button
              onClick={() => setFilterVerified(true)}
              className={`px-4 py-2 text-sm font-medium ${
                filterVerified === true 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } border-t border-b border-r`}
            >
              {t(text.verifiedUsers)}
            </button>
            <button
              onClick={() => setFilterVerified(false)}
              className={`px-4 py-2 text-sm font-medium ${
                filterVerified === false 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } border border-l-0 rounded-r-md`}
            >
              {t(text.unverifiedUsers)}
            </button>
          </div>
        </div>
      </div>
      
      {/* User table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded mb-4 w-5/6"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(text.name)}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(text.whatsapp)}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(text.location)}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(text.products)}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(text.status)}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(text.joined)}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t(text.actions)}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.whatsappNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.productCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isVerified ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {t(text.verified)} {user.verificationLevel && `(${t(text[user.verificationLevel])})`}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {t(text.unverified)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.joinedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/admin/users/${user.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                      {t(text.viewDetails)}
                    </a>
                    {!user.isVerified && (
                      <a href={`/admin/users/${user.id}/verify`} className="text-green-600 hover:text-green-900">
                        {t(text.verify)}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            {t(text.noUsers)}
          </div>
        )}
      </div>
      
      {/* Add user button */}
      <div className="px-6 py-4 border-t border-gray-200">
        <a 
          href="/admin/users/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-5 w-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t(text.addUser)}
        </a>
      </div>
    </div>
  );
};

export default UserManagement;
