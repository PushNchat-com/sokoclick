import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useSellerMockProducts, useSellerMockAuctions } from '../../hooks/useMockData';
import Badge, { BadgeVariant } from '../../components/ui/Badge';
import { AuctionSlot, Product, AuctionState } from '../../types/auctions';
import { formatCurrency } from '../../utils/formatters';
import clsx from 'clsx';

// Mock seller ID - in a real app this would come from authentication
const MOCK_SELLER_ID = 'seller_123';

// Define the available tabs
const SELLER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'auctions', label: 'Auctions' },
  { id: 'sales', label: 'Sales' },
  { id: 'account', label: 'Account' },
];

const SellerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { products, loading: productsLoading, error: productsError } = useSellerMockProducts(MOCK_SELLER_ID);
  const { auctions, loading: auctionsLoading, error: auctionsError } = useSellerMockAuctions(MOCK_SELLER_ID);

  const loading = productsLoading || auctionsLoading;
  const error = productsError || auctionsError;

  // Statistics calculations
  const stats = useMemo(() => {
    if (loading) return null;

    const activeAuctions = auctions.filter(auction => auction.auction_state === 'active').length;
    const completedAuctions = auctions.filter(auction => auction.auction_state === 'completed').length;
    const totalProducts = products.length;
    const totalRevenue = auctions
      .filter(auction => auction.auction_state === 'completed' && auction.current_price)
      .reduce((sum, auction) => sum + (auction.current_price || 0), 0);

    return {
      activeAuctions,
      completedAuctions,
      totalProducts,
      totalRevenue
    };
  }, [auctions, products, loading]);

  // Filter for different auction states
  const activeAuctions = useMemo(() => 
    auctions.filter(auction => auction.auction_state === 'active'),
    [auctions]
  );

  const completedAuctions = useMemo(() => 
    auctions.filter(auction => auction.auction_state === 'completed'),
    [auctions]
  );

  const pendingAuctions = useMemo(() => 
    auctions.filter(auction => auction.auction_state === 'pending'),
    [auctions]
  );

  const scheduledAuctions = useMemo(() => 
    auctions.filter(auction => auction.auction_state === 'scheduled'),
    [auctions]
  );

  // Render badge for auction state
  const renderAuctionStateBadge = (state: AuctionState) => {
    const badgeVariantMap: Record<AuctionState, BadgeVariant> = {
      'active': 'success',
      'completed': 'info',
      'pending': 'warning',
      'scheduled': 'primary',
      'cancelled': 'danger',
      'ended': 'info',
      'failed': 'danger',
      'upcoming': 'primary'
    };
    
    return <Badge variant={badgeVariantMap[state]}>{state}</Badge>;
  };

  // Render the overview tab content
  const renderOverview = () => {
    if (!stats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Auctions" value={stats.activeAuctions} />
        <StatCard title="Completed Auctions" value={stats.completedAuctions} />
        <StatCard title="Total Products" value={stats.totalProducts} />
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue, 'USD')} />
      </div>
    );
  };

  // Render the products tab content
  const renderProducts = () => {
    return (
      <div>
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Your Products</h2>
          <button className="px-4 py-2 bg-primary text-white rounded">Add New Product</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Product</th>
                <th className="py-2 px-4 text-left">Price</th>
                <th className="py-2 px-4 text-left">Category</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{product.name_en}</td>
                  <td className="py-2 px-4">{formatCurrency(product.starting_price, product.currency)}</td>
                  <td className="py-2 px-4">{product.category}</td>
                  <td className="py-2 px-4">
                    {auctions.some(a => a.product_id === product.id && a.auction_state === 'active') 
                      ? <Badge variant="success">In Auction</Badge> 
                      : <Badge variant="primary">Available</Badge>}
                  </td>
                  <td className="py-2 px-4">
                    <button className="text-primary mr-2">Edit</button>
                    <button className="text-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render the auctions tab content
  const renderAuctions = () => {
    return (
      <div>
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Your Auctions</h2>
          <button className="px-4 py-2 bg-primary text-white rounded">Create Auction</button>
        </div>
        
        <div className="flex mb-4 overflow-x-auto">
          <button 
            className={clsx(
              "px-4 py-2 mr-2 rounded", 
              activeTab === 'active' ? "bg-primary text-white" : "bg-gray-200"
            )}
            onClick={() => setActiveTab('active')}
          >
            Active ({activeAuctions.length})
          </button>
          <button 
            className={clsx(
              "px-4 py-2 mr-2 rounded", 
              activeTab === 'scheduled' ? "bg-primary text-white" : "bg-gray-200"
            )}
            onClick={() => setActiveTab('scheduled')}
          >
            Scheduled ({scheduledAuctions.length})
          </button>
          <button 
            className={clsx(
              "px-4 py-2 mr-2 rounded", 
              activeTab === 'pending' ? "bg-primary text-white" : "bg-gray-200"
            )}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({pendingAuctions.length})
          </button>
          <button 
            className={clsx(
              "px-4 py-2 mr-2 rounded", 
              activeTab === 'completed' ? "bg-primary text-white" : "bg-gray-200"
            )}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({completedAuctions.length})
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Product</th>
                <th className="py-2 px-4 text-left">Start Price</th>
                <th className="py-2 px-4 text-left">Current/Final Price</th>
                <th className="py-2 px-4 text-left">Bids</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((auction) => {
                const product = auction.product;
                return (
                  <tr key={auction.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      {products.find(p => p.id === auction.product_id)?.name_en || 'Unknown Product'}
                    </td>
                    <td className="py-2 px-4">
                      {product ? formatCurrency(product.starting_price, product.currency) : '$0.00'}
                    </td>
                    <td className="py-2 px-4">
                      {formatCurrency(auction.current_price || 0, product?.currency || 'USD')}
                    </td>
                    <td className="py-2 px-4">{auction.bid_count || 0}</td>
                    <td className="py-2 px-4">
                      {auction.auction_state && renderAuctionStateBadge(auction.auction_state as AuctionState)}
                    </td>
                    <td className="py-2 px-4">
                      <button className="text-primary mr-2">View</button>
                      {auction.auction_state === 'scheduled' && <button className="text-warning">Cancel</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render the sales tab content
  const renderSales = () => {
    const completedSales = completedAuctions.filter(auction => auction.current_price);
    
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Sales History</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Product</th>
                <th className="py-2 px-4 text-left">Auction ID</th>
                <th className="py-2 px-4 text-left">Buyer</th>
                <th className="py-2 px-4 text-left">Sale Price</th>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {completedSales.map((sale) => {
                const product = sale.product;
                return (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      {products.find(p => p.id === sale.product_id)?.name_en || 'Unknown Product'}
                    </td>
                    <td className="py-2 px-4">{sale.id}</td>
                    <td className="py-2 px-4">{sale.buyer_id || 'Anonymous'}</td>
                    <td className="py-2 px-4">
                      {formatCurrency(sale.current_price || 0, product?.currency || 'USD')}
                    </td>
                    <td className="py-2 px-4">
                      {sale.end_time ? new Date(sale.end_time).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="py-2 px-4">
                      <Badge variant="success">Completed</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render the account tab content
  const renderAccount = () => {
    return (
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Account Settings</h2>
        
        <div className="mb-8 p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" className="w-full p-2 border rounded" defaultValue="Sample Seller" />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full p-2 border rounded" defaultValue="seller@example.com" />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input type="tel" className="w-full p-2 border rounded" defaultValue="+1234567890" />
          </div>
          
          <button className="px-4 py-2 bg-primary text-white rounded">Update Profile</button>
        </div>
        
        <div className="p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Bank Account</label>
            <input type="text" className="w-full p-2 border rounded" defaultValue="**** **** **** 1234" />
          </div>
          
          <button className="px-4 py-2 bg-primary text-white rounded">Update Payment Info</button>
        </div>
      </div>
    );
  };

  // Render the content based on the active tab
  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-red-500">Error loading data</div>;
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'products':
        return renderProducts();
      case 'auctions':
        return renderAuctions();
      case 'sales':
        return renderSales();
      case 'account':
        return renderAccount();
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
        
        {/* Tabs navigation */}
        <div className="flex overflow-x-auto mb-6 border-b">
          {SELLER_TABS.map(tab => (
            <button
              key={tab.id}
              className={clsx(
                "px-4 py-2 mr-2",
                activeTab === tab.id 
                  ? "border-b-2 border-primary text-primary font-medium" 
                  : "text-gray-600 hover:text-primary"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab content */}
        <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow">
          {renderContent()}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Stat card component for the overview dashboard
const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-gray-500 text-sm">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default SellerDashboard;