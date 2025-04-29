import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import SlotGrid from "../../components/admin/slot-management/SlotGrid";
import SlotFilters from "../../components/admin/slot-management/SlotFilters";
import SlotControls from "../../components/admin/slot-management/SlotControls";
import ProductModal from "../../components/admin/products/ProductModal";
import SlotImageModal from "../../components/admin/slot-management/SlotImageModal";
import { useSlotService } from "../../hooks/useSlotService";
import { Slot, SlotStatus } from "../../services/slots";
import { useLanguage } from "../../store/LanguageContext";
import { toast } from "../../components/ui/Toast";

const SlotManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const slotService = useSlotService();

  // State
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<SlotStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Text content
  const text = {
    title: { en: "Slot Management", fr: "Gestion des Emplacements" },
    loading: { en: "Loading slots...", fr: "Chargement des emplacements..." },
    error: {
      en: "Failed to load slots",
      fr: "Impossible de charger les emplacements",
    },
    maintenanceSuccess: {
      en: "Maintenance status updated",
      fr: "Statut de maintenance mis à jour",
    },
    maintenanceError: {
      en: "Failed to update maintenance status",
      fr: "Impossible de mettre à jour le statut de maintenance",
    },
    reserveSuccess: {
      en: "Slot reserved successfully",
      fr: "Emplacement réservé avec succès",
    },
    reserveError: {
      en: "Failed to reserve slot",
      fr: "Impossible de réserver l'emplacement",
    },
    cancelSuccess: { en: "Reservation cancelled", fr: "Réservation annulée" },
    cancelError: {
      en: "Failed to cancel reservation",
      fr: "Impossible d'annuler la réservation",
    },
  };

  // Fetch slots
  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await slotService.getAllSlots();
      if (response.success) {
        setSlots(response.data);
      } else {
        toast.error(t(text.error));
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error(t(text.error));
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSlots();
  }, []);

  // Filter slots based on status and search term
  const filteredSlots = slots.filter((slot) => {
    // Filter by status if a filter is selected
    if (filterStatus !== null && slot.status !== filterStatus) {
      return false;
    }

    // Filter by search term if one is provided
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      return (
        slot.id.toLowerCase().includes(searchLower) ||
        slot.name.toLowerCase().includes(searchLower) ||
        (slot.description &&
          slot.description.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Handle slot selection
  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  // Toggle maintenance status
  const handleToggleMaintenance = async (slotId: string) => {
    try {
      const slotToUpdate = slots.find((s) => s.id === slotId);
      if (!slotToUpdate) return;

      const newStatus =
        slotToUpdate.status === SlotStatus.MAINTENANCE
          ? SlotStatus.AVAILABLE
          : SlotStatus.MAINTENANCE;

      const response = await slotService.updateSlotStatus(slotId, newStatus);

      if (response.success) {
        toast.success(t(text.maintenanceSuccess));
        fetchSlots();
      } else {
        toast.error(t(text.maintenanceError));
      }
    } catch (error) {
      console.error("Error updating maintenance status:", error);
      toast.error(t(text.maintenanceError));
    }
  };

  // Reserve a slot
  const handleReserveSlot = async (slotId: string) => {
    try {
      const response = await slotService.reserveSlot(slotId);

      if (response.success) {
        toast.success(t(text.reserveSuccess));
        fetchSlots();
      } else {
        toast.error(t(text.reserveError));
      }
    } catch (error) {
      console.error("Error reserving slot:", error);
      toast.error(t(text.reserveError));
    }
  };

  // Cancel a reservation
  const handleCancelReservation = async (slotId: string) => {
    try {
      const response = await slotService.cancelReservation(slotId);

      if (response.success) {
        toast.success(t(text.cancelSuccess));
        fetchSlots();
      } else {
        toast.error(t(text.cancelError));
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error(t(text.cancelError));
    }
  };

  // Handle view products for a slot
  const handleViewProducts = () => {
    setShowProductModal(true);
  };

  // Handle view images for a slot
  const handleViewImages = () => {
    setShowImageModal(true);
  };

  // Handle after product actions
  const handleProductModalClose = (productChanged: boolean) => {
    setShowProductModal(false);
    if (productChanged) {
      fetchSlots();
    }
  };

  // Handle after image actions
  const handleImageModalClose = (imagesChanged: boolean) => {
    setShowImageModal(false);
    if (imagesChanged) {
      fetchSlots();
    }
  };

  return (
    <AdminLayout title={t(text.title)}>
      <div className="space-y-4 p-4">
        {/* Filters */}
        <SlotFilters
          filterStatus={filterStatus}
          searchTerm={searchTerm}
          onFilterChange={setFilterStatus}
          onSearchChange={setSearchTerm}
        />

        {/* Slot Controls */}
        <SlotControls
          selectedSlot={selectedSlot}
          onRefresh={fetchSlots}
          onViewProducts={handleViewProducts}
          onViewImages={handleViewImages}
          onToggleMaintenance={handleToggleMaintenance}
          onReserveSlot={handleReserveSlot}
          onCancelReservation={handleCancelReservation}
        />

        {/* Slots Grid */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t(text.loading)}</p>
          </div>
        ) : (
          <SlotGrid
            slots={filteredSlots}
            selectedSlotId={selectedSlot?.id}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>

      {/* Modals */}
      {showProductModal && selectedSlot && (
        <ProductModal
          slotId={selectedSlot.id}
          onClose={handleProductModalClose}
        />
      )}

      {showImageModal && selectedSlot && (
        <SlotImageModal slot={selectedSlot} onClose={handleImageModalClose} />
      )}
    </AdminLayout>
  );
};

export default SlotManagementPage;
