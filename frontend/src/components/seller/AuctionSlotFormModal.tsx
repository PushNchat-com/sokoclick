import React from 'react';
import { useTranslation } from 'react-i18next';
import { AuctionSlot } from '../../types/auctions';
import Modal from '../ui/Modal';
import AuctionSlotForm from './AuctionSlotForm';

interface AuctionSlotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (slotId: number) => void;
  auctionSlot?: AuctionSlot;
}

const AuctionSlotFormModal: React.FC<AuctionSlotFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  auctionSlot
}) => {
  const { t } = useTranslation();
  
  const handleSuccess = (slotId: number) => {
    onSuccess(slotId);
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={auctionSlot ? t('auction.editSlot') : t('auction.createSlot')}
      size="lg"
    >
      <AuctionSlotForm
        auctionSlot={auctionSlot}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
};

export default AuctionSlotFormModal; 