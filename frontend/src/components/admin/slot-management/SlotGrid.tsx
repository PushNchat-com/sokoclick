import React from 'react';
import { Slot, SlotStatus } from '../../../services/slots';
import { useTranslation } from 'react-i18next';

interface SlotGridProps {
  slots: Slot[];
  loading: boolean;
  selectedSlotId?: string;
  onSelectSlot: (slot: Slot) => void;
  onReserveSlot?: (slot: Slot) => void;
  onCancelReservation?: (slot: Slot) => void;
  onToggleMaintenance?: (slot: Slot) => void;
}

const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  loading,
  selectedSlotId,
  onSelectSlot,
  onReserveSlot,
  onCancelReservation,
  onToggleMaintenance
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'fr';
  
  // Status text for display
  const statusText = {
    [SlotStatus.AVAILABLE]: {
      en: 'Available',
      fr: 'Disponible'
    },
    [SlotStatus.RESERVED]: {
      en: 'Reserved',
      fr: 'Réservé'
    },
    [SlotStatus.MAINTENANCE]: {
      en: 'Maintenance',
      fr: 'Maintenance'
    },
    [SlotStatus.OCCUPIED]: {
      en: 'Occupied',
      fr: 'Occupé'
    }
  };

  // Calculate CSS class based on slot status
  const getSlotClass = (slot: Slot, isSelected: boolean) => {
    let baseClass = 'slot-grid-item';
    
    if (isSelected) {
      baseClass += ' selected';
    }
    
    switch (slot.status) {
      case SlotStatus.AVAILABLE:
        return `${baseClass} available`;
      case SlotStatus.RESERVED:
        return `${baseClass} reserved`;
      case SlotStatus.MAINTENANCE:
        return `${baseClass} maintenance`;
      case SlotStatus.OCCUPIED:
        return `${baseClass} occupied`;
      default:
        return baseClass;
    }
  };

  if (loading) {
    return (
      <div className="slot-grid-loading">
        <div className="spinner"></div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="slot-grid-empty">
        <p>{t('noSlotsAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="slot-grid-container">
      <div className="slot-grid">
        {slots.map(slot => {
          const isSelected = selectedSlotId === slot.id;
          
          return (
            <div 
              key={slot.id}
              className={getSlotClass(slot, isSelected)}
              onClick={() => onSelectSlot(slot)}
            >
              <div className="slot-number">{slot.slotNumber}</div>
              <div className="slot-status">
                {statusText[slot.status][currentLanguage]}
              </div>
              
              {slot.imageUrl ? (
                <div className="slot-image">
                  <img src={slot.imageUrl} alt={`Slot ${slot.slotNumber}`} />
                </div>
              ) : (
                <div className="slot-image-placeholder">
                  <span>{t('noImage')}</span>
                </div>
              )}
              
              <div className="slot-actions">
                {slot.status === SlotStatus.AVAILABLE && onReserveSlot && (
                  <button 
                    className="btn btn-reserve"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReserveSlot(slot);
                    }}
                  >
                    {t('reserve')}
                  </button>
                )}
                
                {slot.status === SlotStatus.RESERVED && onCancelReservation && (
                  <button 
                    className="btn btn-cancel"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelReservation(slot);
                    }}
                  >
                    {t('cancel')}
                  </button>
                )}
                
                {onToggleMaintenance && (
                  <button 
                    className="btn btn-maintenance"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMaintenance(slot);
                    }}
                  >
                    {slot.status === SlotStatus.MAINTENANCE
                      ? t('endMaintenance')
                      : t('startMaintenance')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .slot-grid-container {
          width: 100%;
          padding: 16px;
        }
        
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .slot-grid-item {
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          position: relative;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .slot-grid-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .slot-grid-item.selected {
          border-color: #0070f3;
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
        }
        
        .slot-grid-item.available {
          background-color: rgba(46, 204, 113, 0.1);
        }
        
        .slot-grid-item.reserved {
          background-color: rgba(241, 196, 15, 0.1);
        }
        
        .slot-grid-item.maintenance {
          background-color: rgba(231, 76, 60, 0.1);
        }
        
        .slot-grid-item.occupied {
          background-color: rgba(52, 152, 219, 0.1);
        }
        
        .slot-number {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .slot-status {
          font-size: 0.875rem;
          margin-bottom: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        
        .available .slot-status {
          background-color: rgba(46, 204, 113, 0.2);
          color: #27ae60;
        }
        
        .reserved .slot-status {
          background-color: rgba(241, 196, 15, 0.2);
          color: #f39c12;
        }
        
        .maintenance .slot-status {
          background-color: rgba(231, 76, 60, 0.2);
          color: #c0392b;
        }
        
        .occupied .slot-status {
          background-color: rgba(52, 152, 219, 0.2);
          color: #2980b9;
        }
        
        .slot-image {
          width: 100%;
          height: 120px;
          overflow: hidden;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        
        .slot-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .slot-image-placeholder {
          width: 100%;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          border-radius: 4px;
          margin-bottom: 12px;
          color: #999;
        }
        
        .slot-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: auto;
        }
        
        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        
        .btn-reserve {
          background-color: #2ecc71;
          color: white;
        }
        
        .btn-reserve:hover {
          background-color: #27ae60;
        }
        
        .btn-cancel {
          background-color: #e74c3c;
          color: white;
        }
        
        .btn-cancel:hover {
          background-color: #c0392b;
        }
        
        .btn-maintenance {
          background-color: #3498db;
          color: white;
        }
        
        .btn-maintenance:hover {
          background-color: #2980b9;
        }
        
        .slot-grid-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #0070f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .slot-grid-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          background-color: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default SlotGrid; 