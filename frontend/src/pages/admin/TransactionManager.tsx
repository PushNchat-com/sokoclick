import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';

// Transaction status constants
const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
};

// Mock transaction data
const mockTransactions = [
  {
    id: 'TRX-001',
    productId: 'PRD-001',
    productName: 'Bose QuietComfort 45 Headphones',
    buyerId: 'USR-005',
    buyerName: 'Jane Doe',
    sellerId: 'USR-002',
    sellerName: 'Tech Store',
    amount: 35000,
    fee: 1750,
    payoutAmount: 33250,
    createdAt: new Date('2023-06-10T15:30:00'),
    status: TRANSACTION_STATUS.COMPLETED,
    paymentMethod: 'M-Pesa',
    transactionReference: 'MP-87654321',
    notes: 'Customer picked up in store'
  },
  {
    id: 'TRX-002',
    productId: 'PRD-003',
    productName: 'Sony PlayStation 5 Digital Edition',
    buyerId: 'USR-008',
    buyerName: 'John Smith',
    sellerId: 'USR-003',
    sellerName: 'Game World',
    amount: 55000,
    fee: 2750,
    payoutAmount: 52250,
    createdAt: new Date('2023-06-15T10:45:00'),
    status: TRANSACTION_STATUS.PENDING,
    paymentMethod: 'Credit Card',
    transactionReference: 'CC-12345678',
    notes: 'Awaiting shipment confirmation'
  },
  {
    id: 'TRX-003',
    productId: 'PRD-007',
    productName: 'MacBook Pro 16" M1 Pro',
    buyerId: 'USR-010',
    buyerName: 'Sarah Johnson',
    sellerId: 'USR-004',
    sellerName: 'Apple Reseller',
    amount: 280000,
    fee: 14000,
    payoutAmount: 266000,
    createdAt: new Date('2023-06-12T09:15:00'),
    status: TRANSACTION_STATUS.DISPUTED,
    paymentMethod: 'Bank Transfer',
    transactionReference: 'BT-45678901',
    notes: 'Customer claims item was damaged, waiting for resolution'
  },
  {
    id: 'TRX-004',
    productId: 'PRD-012',
    productName: 'Samsung 65" QLED 4K TV',
    buyerId: 'USR-015',
    buyerName: 'Michael Brown',
    sellerId: 'USR-006',
    sellerName: 'Electronics Hub',
    amount: 120000,
    fee: 6000,
    payoutAmount: 114000,
    createdAt: new Date('2023-06-18T14:20:00'),
    status: TRANSACTION_STATUS.PROCESSING,
    paymentMethod: 'M-Pesa',
    transactionReference: 'MP-23456789',
    notes: 'Payment confirmed, preparing for delivery'
  },
  {
    id: 'TRX-005',
    productId: 'PRD-018',
    productName: 'iPhone 14 Pro Max',
    buyerId: 'USR-020',
    buyerName: 'Emily Wilson',
    sellerId: 'USR-004',
    sellerName: 'Apple Reseller',
    amount: 180000,
    fee: 9000,
    payoutAmount: 171000,
    createdAt: new Date('2023-06-20T11:30:00'),
    status: TRANSACTION_STATUS.REFUNDED,
    paymentMethod: 'Credit Card',
    transactionReference: 'CC-98765432',
    notes: 'Customer requested refund due to change of mind'
  },
  {
    id: 'TRX-006',
    productId: 'PRD-025',
    productName: 'Canon EOS R5 Camera',
    buyerId: 'USR-018',
    buyerName: 'David Lee',
    sellerId: 'USR-007',
    sellerName: 'Photo World',
    amount: 350000,
    fee: 17500,
    payoutAmount: 332500,
    createdAt: new Date('2023-06-22T09:45:00'),
    status: TRANSACTION_STATUS.CANCELLED,
    paymentMethod: 'Bank Transfer',
    transactionReference: 'BT-56789012',
    notes: 'Seller cancelled due to inventory issues'
  }
];

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onStatusChange: (id: string, newStatus: string) => void;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onStatusChange 
}) => {
  const { t } = useTranslation();
  const [newStatus, setNewStatus] = useState(transaction?.status || '');

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('admin.transactionDetails')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-semibold mb-2">{t('admin.transactionInfo')}</h3>
            <p><span className="font-medium">{t('admin.id')}:</span> {transaction.id}</p>
            <p><span className="font-medium">{t('admin.date')}:</span> {transaction.createdAt.toLocaleString()}</p>
            <p><span className="font-medium">{t('admin.status')}:</span> <Badge color={getBadgeColor(transaction.status)}>{transaction.status}</Badge></p>
            <p><span className="font-medium">{t('admin.paymentMethod')}:</span> {transaction.paymentMethod}</p>
            <p><span className="font-medium">{t('admin.reference')}:</span> {transaction.transactionReference}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">{t('admin.financialDetails')}</h3>
            <p><span className="font-medium">{t('admin.amount')}:</span> KSh {transaction.amount.toLocaleString()}</p>
            <p><span className="font-medium">{t('admin.fee')}:</span> KSh {transaction.fee.toLocaleString()}</p>
            <p><span className="font-medium">{t('admin.payoutAmount')}:</span> KSh {transaction.payoutAmount.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-semibold mb-2">{t('admin.productInfo')}</h3>
            <p><span className="font-medium">{t('admin.product')}:</span> {transaction.productName}</p>
            <p><span className="font-medium">{t('admin.productId')}:</span> {transaction.productId}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">{t('admin.parties')}</h3>
            <p><span className="font-medium">{t('admin.buyer')}:</span> {transaction.buyerName} ({transaction.buyerId})</p>
            <p><span className="font-medium">{t('admin.seller')}:</span> {transaction.sellerName} ({transaction.sellerId})</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">{t('admin.notes')}</h3>
          <p className="bg-gray-50 p-3 rounded">{transaction.notes}</p>
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">{t('admin.updateStatus')}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(TRANSACTION_STATUS).map((status) => (
              <button
                key={status}
                onClick={() => setNewStatus(status)}
                className={`px-3 py-1 rounded-full text-sm ${
                  newStatus === status 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('admin.cancel')}</Button>
          <Button 
            variant="primary" 
            onClick={() => {
              onStatusChange(transaction.id, newStatus);
              onClose();
            }}
            disabled={newStatus === transaction.status}
          >
            {t('admin.updateTransaction')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const TransactionManager: React.FC = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [transactions, setTransactions] = useState(mockTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filter transactions based on status and search term
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesStatus = statusFilter === '' || transaction.status === statusFilter;
      const matchesSearch = searchTerm === '' || 
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [transactions, statusFilter, searchTerm]);

  // Function to get badge color based on status
  function getBadgeColor(status: string): 'primary' | 'success' | 'error' | 'warning' | 'info' {
    switch (status) {
      case TRANSACTION_STATUS.COMPLETED:
        return 'success';
      case TRANSACTION_STATUS.PENDING:
        return 'warning';
      case TRANSACTION_STATUS.PROCESSING:
        return 'info';
      case TRANSACTION_STATUS.DISPUTED:
        return 'error';
      case TRANSACTION_STATUS.REFUNDED:
        return 'info';
      case TRANSACTION_STATUS.CANCELLED:
        return 'error';
      default:
        return 'primary';
    }
  }

  // Handler for viewing transaction details
  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  // Handler for changing transaction status
  const handleStatusChange = (id: string, newStatus: string) => {
    setTransactions(transactions.map(transaction => 
      transaction.id === id ? { ...transaction, status: newStatus } : transaction
    ));
  };

  // Format currency
  const formatAmount = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder={t('admin.searchTransactions')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === '' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('admin.all')}
          </button>
          {Object.values(TRANSACTION_STATUS).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === status ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.id')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.product')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.buyer')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.seller')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.amount')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.date')}
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    {t('admin.noTransactionsFound')}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.buyerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.sellerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={getBadgeColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleViewTransaction(transaction)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        {t('admin.view')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && selectedTransaction && (
        <TransactionDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          transaction={selectedTransaction}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default TransactionManager; 