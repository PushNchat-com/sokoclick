import React, { useEffect, useRef } from "react";
import { Slot, SlotStatus } from "../../../services/slots";
import { useTranslation } from "react-i18next";

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
  onToggleMaintenance,
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as "en" | "fr";
  const gridRef = useRef<HTMLDivElement>(null);

  // Status text for display
  const statusText = {
    [SlotStatus.AVAILABLE]: {
      en: "Available",
      fr: "Disponible",
    },
    [SlotStatus.RESERVED]: {
      en: "Reserved",
      fr: "Réservé",
    },
    [SlotStatus.MAINTENANCE]: {
      en: "Maintenance",
      fr: "Maintenance",
    },
    [SlotStatus.OCCUPIED]: {
      en: "Occupied",
      fr: "Occupé",
    },
  };

  // Calculate CSS class based on slot status
  const getSlotClass = (slot: Slot, isSelected: boolean) => {
    let baseClass = "slot-grid-item";

    if (isSelected) {
      baseClass += " selected";
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation if the grid has focus
      if (!gridRef.current?.contains(document.activeElement)) return;

      const focusedElement = document.activeElement as HTMLElement;
      const slotItems = Array.from(
        gridRef.current?.querySelectorAll('[role="gridcell"]') || [],
      );

      if (!slotItems.length) return;

      const focusedIndex = slotItems.indexOf(focusedElement);
      if (focusedIndex === -1) return;

      let newIndex = focusedIndex;
      const columns = Math.floor(gridRef.current?.clientWidth / 200) || 4;

      switch (e.key) {
        case "ArrowRight":
          newIndex = Math.min(slotItems.length - 1, focusedIndex + 1);
          break;
        case "ArrowLeft":
          newIndex = Math.max(0, focusedIndex - 1);
          break;
        case "ArrowDown":
          newIndex = Math.min(slotItems.length - 1, focusedIndex + columns);
          break;
        case "ArrowUp":
          newIndex = Math.max(0, focusedIndex - columns);
          break;
        case "Home":
          newIndex = 0;
          break;
        case "End":
          newIndex = slotItems.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== focusedIndex) {
        e.preventDefault();
        (slotItems[newIndex] as HTMLElement).focus();
      }
    };

    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.addEventListener("keydown", handleKeyDown);
      return () => gridElement.removeEventListener("keydown", handleKeyDown);
    }
  }, [slots]);

  if (loading) {
    return (
      <div className="slot-grid-loading" aria-busy="true" aria-live="polite">
        <div className="spinner" role="status">
          <span className="sr-only">{t("loading")}</span>
        </div>
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="slot-grid-empty" aria-live="polite">
        <p>{t("noSlotsAvailable")}</p>
      </div>
    );
  }

  return (
    <div className="slot-grid-container" aria-labelledby="slot-grid-title">
      <h2 id="slot-grid-title" className="sr-only">
        {t("slotGrid")}
      </h2>
      <div
        className="slot-grid"
        ref={gridRef}
        role="grid"
        aria-rowcount={Math.ceil(slots.length / 4)}
        aria-colcount={4}
      >
        {slots.map((slot, index) => {
          const isSelected = selectedSlotId === slot.id;
          const rowIndex = Math.floor(index / 4);
          const colIndex = index % 4;

          return (
            <div
              key={slot.id}
              className={getSlotClass(slot, isSelected)}
              onClick={() => onSelectSlot(slot)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectSlot(slot);
                }
              }}
              role="gridcell"
              tabIndex={0}
              aria-selected={isSelected}
              aria-rowindex={rowIndex + 1}
              aria-colindex={colIndex + 1}
              aria-describedby={`slot-status-${slot.id}`}
            >
              <div className="slot-number" id={`slot-number-${slot.id}`}>
                {slot.slotNumber}
              </div>

              <div className="slot-status" id={`slot-status-${slot.id}`}>
                <span aria-hidden="true">
                  {statusText[slot.status][currentLanguage]}
                </span>
                <span className="sr-only">
                  {t("slotNumberWithStatus", {
                    number: slot.slotNumber,
                    status: statusText[slot.status][currentLanguage],
                  })}
                </span>
              </div>

              {slot.imageUrl ? (
                <div className="slot-image">
                  <img src={slot.imageUrl} alt="" aria-hidden="true" />
                </div>
              ) : (
                <div className="slot-image-placeholder" aria-hidden="true">
                  <span>{t("noImage")}</span>
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
                    aria-label={t("reserveSlotWithNumber", {
                      number: slot.slotNumber,
                    })}
                  >
                    {t("reserve")}
                  </button>
                )}

                {slot.status === SlotStatus.RESERVED && onCancelReservation && (
                  <button
                    className="btn btn-cancel"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelReservation(slot);
                    }}
                    aria-label={t("cancelReservationWithNumber", {
                      number: slot.slotNumber,
                    })}
                  >
                    {t("cancel")}
                  </button>
                )}

                {onToggleMaintenance && (
                  <button
                    className="btn btn-maintenance"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMaintenance(slot);
                    }}
                    aria-label={
                      slot.status === SlotStatus.MAINTENANCE
                        ? t("endMaintenanceWithNumber", {
                            number: slot.slotNumber,
                          })
                        : t("startMaintenanceWithNumber", {
                            number: slot.slotNumber,
                          })
                    }
                  >
                    {slot.status === SlotStatus.MAINTENANCE
                      ? t("endMaintenance")
                      : t("startMaintenance")}
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
          transition:
            transform 0.2s,
            box-shadow 0.2s;
        }

        .slot-grid-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .slot-grid-item:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.4);
          transform: translateY(-3px);
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
          background-color: #f1f1f1;
          border-radius: 4px;
          margin-bottom: 12px;
          color: #666;
          font-size: 0.875rem;
        }

        .slot-actions {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
        }

        .btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.4);
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
          background-color: #f39c12;
          color: white;
        }

        .btn-maintenance:hover {
          background-color: #d35400;
        }

        .slot-grid-loading {
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #666;
        }

        .spinner {
          margin-bottom: 16px;
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top-color: #0070f3;
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .slot-grid-empty {
          padding: 40px;
          text-align: center;
          color: #666;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default SlotGrid;
