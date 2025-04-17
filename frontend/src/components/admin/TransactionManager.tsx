import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabaseClient } from '../../lib/supabase';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useToast } from '../ui/Toast';
import LoadingState from '../ui/LoadingState';
import Modal from '../ui/Modal';

interface Transaction {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  commission_amount: number | null;
  status: string;
  payment_method: string | null;
  whatsapp_thread_id: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
  // Joined data
  product_name?: string;
  buyer_name?: string;
  seller_name?: string;
}

const TRANSACTION_STATUSES = [
  'agreement_reached',
  'payment_pending',
  'payment_received',
  'shipping_pending',
  'shipped',
  'received',
  'buyer_confirmed',
  'seller_paid',
  'seller_confirmed',
  'completed',
  'disputed',
  'cancelled'
];

const TransactionManager: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get transactions with product, buyer, and seller information
      const { data, error: fetchError } = await supabaseClient
        .from('transactions')
        .select(`
          *,
          products(name_en, name_fr),
          buyer:buyer_id(email, whatsapp_number),
          seller:seller_id(email, whatsapp_number)
        `);

      if (fetchError) throw fetchError;

      // Transform data to include readable names
      const transformedData = data.map(transaction => ({
        ...transaction,
        product_name: transaction.products?.name_en,
        buyer_name: transaction.buyer?.email,
        seller_name: transaction.seller?.email
      }));

      setTransactions(transformedData);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      
      // For development only
      if (process.env.NODE_ENV !== 'production') {
        setTransactions(getMockTransactions());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Update transaction status
  const updateTransactionStatus = async () => {
    if (!selectedTransaction || !newStatus) return;
    
    setSubmitLoading(true);
    try {
      const { error } = await supabaseClient
        .from('transactions')
        .update({ 
          status: newStatus,
          notes: newNotes ? `${selectedTransaction.notes ? selectedTransaction.notes + '\n' : ''}${new Date().toISOString()}: ${newNotes}` : selectedTransaction.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      // Update local state
      setTransactions(transactions.map(transaction => 
        transaction.id === selectedTransaction.id 
          ? { 
              ...transaction, 
              status: newStatus,
              notes: newNotes ? `${transaction.notes ? transaction.notes + '\n' : ''}${new Date().toISOString()}: ${newNotes}` : transaction.notes,
              updated_at: new Date().toISOString()
            } 
          : transaction
      ));

      setIsUpdateStatusModalOpen(false);
      setNewStatus('');
      setNewNotes('');
      toast.success(t('admin.transactionStatusUpdated'));
    } catch (err) {
      console.error('Error updating transaction status:', err);
      toast.error(t('admin.transactionStatusUpdateError'));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle opening transaction details
  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };

  // Handle opening status update modal
  const openUpdateStatusModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setNewStatus(transaction.status);
    setNewNotes('');
    setIsUpdateStatusModalOpen(true);
  };

  // Filter transactions based on status and search
  const filteredTransactions = transactions.filter(transaction => {
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.product_name && transaction.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.buyer_name && transaction.buyer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.seller_name && transaction.seller_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Mock data for development purposes
  const getMockTransactions = (): Transaction[] => {
    return [
      {
        id: '1',
        product_id: 'prod-1',
        buyer_id: 'buyer-1',
        seller_id: 'seller-1',
        amount: 1500,
        currency: 'XAF',
        commission_amount: 150,
        status: 'payment_pending',
        payment_method: 'bank_transfer',
        whatsapp_thread_id: 'whatsapp-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Buyer and seller have agreed on price',
        product_name: 'Smartphone XYZ',
        buyer_name: 'buyer@example.com',
        seller_name: 'seller@example.com'
      },
      {
        id: '2',
        product_id: 'prod-2',
        buyer_id: 'buyer-2',
        seller_id: 'seller-2',
        amount: 3000,
        currency: 'XAF',
        commission_amount: 300,
        status: 'completed',
        payment_method: 'mobile_money',
        whatsapp_thread_id: 'whatsapp-2',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Transaction completed successfully',
        product_name: 'Wireless Headphones',
        buyer_name: 'buyer2@example.com',
        seller_name: 'seller2@example.com'
      },
      {
        id: '3',
        product_id: 'prod-3',
        buyer_id: 'buyer-3',
        seller_id: 'seller-1',
        amount: 5000,
        currency: 'XAF',
        commission_amount: 500,
        status: 'disputed',
        payment_method: 'cash',
        whatsapp_thread_id: 'whatsapp-3',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Buyer claims product was not as described',
        product_name: 'Designer Watch',
        buyer_name: 'buyer3@example.com',
        seller_name: 'seller@example.com'
      }
    ];
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      agreement_reached: 'info',
      payment_pending: 'warning',
      payment_received: 'success',
      shipping_pending: 'warning',
      shipped: 'info',
      received: 'info',
      buyer_confirmed: 'success',
      seller_paid: 'success',
      seller_confirmed: 'success',
      completed: 'primary',
      disputed: 'danger',
      cancelled: 'danger'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {t(`transaction.status.${status}`)}
      </Badge>
    );
  };

  // Format transaction date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <LoadingState message={t('admin.loadingTransactions')} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md my-4">
        <p className="font-bold">{t('admin.errorFetchingTransactions')}:</p>
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-2" 
          onClick={fetchTransactions}
        >
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold">{t('admin.transactionManagement.title')}</h2>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              className="border border-gray-300 rounded-md px-3 py-2 pr-8 w-full sm:w-60"
              placeholder={t('admin.searchTransactions')}
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
            className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('admin.allStatuses')}</option>
            {TRANSACTION_STATUSES.map(status => (
              <option key={status} value={status}>
                {t(`transaction.status.${status}`)}
              </option>
            ))}
          </select>
          
          <Button 
            variant="outline" 
            onClick={fetchTransactions}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {t('admin.noTransactionsFound')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.transaction')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.product')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.parties')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.amount')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.status')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ID: {transaction.id.substring(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(transaction.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.product_name || transaction.product_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {t('admin.buyer')}: {transaction.buyer_name || transaction.buyer_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('admin.seller')}: {transaction.seller_name || transaction.seller_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.amount.toLocaleString()} {transaction.currency}
                      </div>
                      {transaction.commission_amount && (
                        <div className="text-xs text-gray-500">
                          {t('admin.commission')}: {transaction.commission_amount.toLocaleString()} {transaction.currency}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewTransactionDetails(transaction)}
                        >
                          {t('admin.view')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openUpdateStatusModal(transaction)}
                        >
                          {t('admin.updateStatus')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={t('admin.transactionDetails')}
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.transactionId')}</h3>
                <p className="mt-1">{selectedTransaction.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.status')}</h3>
                <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.product')}</h3>
                <p className="mt-1">{selectedTransaction.product_name || selectedTransaction.product_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.amount')}</h3>
                <p className="mt-1 font-medium">{selectedTransaction.amount.toLocaleString()} {selectedTransaction.currency}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.buyer')}</h3>
                <p className="mt-1">{selectedTransaction.buyer_name || selectedTransaction.buyer_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.seller')}</h3>
                <p className="mt-1">{selectedTransaction.seller_name || selectedTransaction.seller_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.paymentMethod')}</h3>
                <p className="mt-1">{selectedTransaction.payment_method || t('admin.notSpecified')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.commission')}</h3>
                <p className="mt-1">
                  {selectedTransaction.commission_amount 
                    ? `${selectedTransaction.commission_amount.toLocaleString()} ${selectedTransaction.currency}`
                    : t('admin.notSpecified')
                  }
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.createdAt')}</h3>
                <p className="mt-1">{formatDate(selectedTransaction.created_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{t('admin.updatedAt')}</h3>
                <p className="mt-1">{formatDate(selectedTransaction.updated_at)}</p>
              </div>
            </div>
            
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500">{t('admin.notes')}</h3>
              <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50 min-h-[100px] whitespace-pre-line">
                {selectedTransaction.notes || t('admin.noNotes')}
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                variant="primary"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  openUpdateStatusModal(selectedTransaction);
                }}
              >
                {t('admin.updateStatus')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isUpdateStatusModalOpen}
        onClose={() => setIsUpdateStatusModalOpen(false)}
        title={t('admin.updateTransactionStatus')}
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.currentStatus')}
              </label>
              <div className="py-2">
                {getStatusBadge(selectedTransaction.status)}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.newStatus')}
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {TRANSACTION_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {t(`transaction.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.addNote')}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder={t('admin.enterNote')}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsUpdateStatusModalOpen(false)}
                disabled={submitLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={updateTransactionStatus}
                disabled={submitLoading || newStatus === selectedTransaction.status}
                loading={submitLoading}
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionManager; 