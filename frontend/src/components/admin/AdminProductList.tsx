import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import { Dialog } from '../ui/Dialog';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { ProductStatus } from '../../utils/productFormValidation';
import { useDebounce } from '../../hooks/useDebounce';
import { formatPrice } from '../../utils/formatters';

interface AdminProductListProps {
  products: Product[];
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateStatus: (productId: string, status: ProductStatus) => Promise<void>;
  isLoading?: boolean;
}

const AdminProductList: React.FC<AdminProductListProps> = ({
  products,
  onDeleteProduct,
  onUpdateStatus,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price'>('date');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name_en.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.name_fr.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.description_en.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.description_fr.toLowerCase().includes(debouncedSearch.toLowerCase()));
    const matchesCategory = !categoryFilter || product.category_id === categoryFilter;
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name_en.localeCompare(b.name_en);
      case 'price':
        return a.price - b.price;
      case 'date':
      default:
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    }
  });

  const handleCreateProduct = () => {
    navigate('/admin/products/new');
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/admin/products/${productId}/edit`);
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleAssignSlot = (productId: string) => {
    navigate(`/admin/products/${productId}/assign-slot`);
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await onDeleteProduct(productToDelete);
      setDeleteDialogOpen(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (productId: string, newStatus: ProductStatus) => {
    setUpdatingStatus(productId);
    try {
      await onUpdateStatus(productId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadgeColor = (status: ProductStatus): 'green' | 'yellow' | 'red' | 'gray' => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'rejected':
        return 'red';
      case 'inactive':
      default:
        return 'gray';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-4 items-center">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3">
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4">
                <div className="grid grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <Button onClick={handleCreateProduct}>Create New Product</Button>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-64"
        />
        
        <Select
          value={categoryFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All Categories</option>
          {categories.map((category: Category) => (
            <option key={category.id} value={category.id}>
              {category.name_en}
            </option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value as ProductStatus | '';
            setStatusFilter(value);
          }}
          className="w-48"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="inactive">Inactive</option>
        </Select>

        <Select
          value={sortBy}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'date' | 'name' | 'price')}
          className="w-48"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={product.image_urls[0] || '/placeholder.png'}
                        alt=""
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name_en}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {categories.find((c: Category) => c.id === product.category_id)?.name_en || product.category_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatPrice(product.price, product.currency)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge 
                    color={getStatusBadgeColor(product.status)}
                    className={updatingStatus === product.id ? 'opacity-50' : ''}
                  >
                    {product.status}
                    {updatingStatus === product.id && (
                      <span className="ml-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    )}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewProduct(product.id || '')}
                    disabled={isDeleting || updatingStatus === product.id}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditProduct(product.id || '')}
                    disabled={isDeleting || updatingStatus === product.id}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAssignSlot(product.id || '')}
                    disabled={isDeleting || updatingStatus === product.id}
                  >
                    Assign Slot
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(product.id || '')}
                    disabled={isDeleting || updatingStatus === product.id}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Product"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this product? This action cannot be undone.</p>
          {deleteError && (
            <p className="text-red-500">{deleteError}</p>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminProductList; 