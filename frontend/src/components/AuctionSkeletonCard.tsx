import React from 'react';

const AuctionSkeletonCard: React.FC = () => {
  return (
    <div className="card">
      <div className="aspect-w-16 aspect-h-9">
        <div className="w-full h-full bg-gray-200 animate-skeleton-pulse"></div>
      </div>
      
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded animate-skeleton-pulse mb-2 w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded animate-skeleton-pulse mb-3 w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded animate-skeleton-pulse w-full"></div>
      </div>
    </div>
  );
};

export default AuctionSkeletonCard; 