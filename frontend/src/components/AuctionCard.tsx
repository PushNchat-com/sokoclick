import React from 'react';
import { AuctionSlot as AuctionSlotType } from '../types/supabase';
import AuctionSlot from './auction/AuctionSlot';

interface AuctionCardProps {
  slot: AuctionSlotType;
}

/**
 * AuctionCard component that uses the AuctionSlot component
 * This wrapper ensures backward compatibility with existing code
 */
const AuctionCard: React.FC<AuctionCardProps> = ({ slot }) => {
  return <AuctionSlot slot={slot} />;
};

export default AuctionCard; 