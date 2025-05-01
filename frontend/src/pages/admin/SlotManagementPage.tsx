import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import SlotGrid from "@/components/admin/slot-management/SlotGrid";
import SlotFilters from "@/components/admin/slot-management/SlotFilters";
import { Button } from "@/components/ui/Button";
import { slotService } from "@/services/slots/SlotService";
import { useSlots } from "@/hooks/useSlots";
import type { Database } from "@/types/supabase-types";
import { SlotStatus } from "@/utils/slotUtils";
import { useLanguage } from "@/store/LanguageContext";
import { toast } from "@/utils/toast";
import AdminDashboardWrapper from "@/components/admin/AdminDashboardWrapper";
import AdminErrorBoundary from "@/components/admin/AdminErrorBoundary";

type Slot = Database["public"]["Tables"]["auction_slots"]["Row"];

const SlotManagementPage: React.FC = () => {
  const { t } = useLanguage();

  const [filterStatus, setFilterStatus] = useState<SlotStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { slots, loading, error, refresh } = useSlots({
    status: filterStatus === 'all' ? undefined : filterStatus,
    searchTerm: searchTerm,
  });

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
    refreshButton: { en: "Refresh", fr: "Actualiser" },
  };

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    console.log("Selected Slot:", slot);
  };

  const handleToggleMaintenance = async (slotId: number) => {
    setIsProcessing(true);
    try {
      const result = await slotService.toggleMaintenance(slotId);

      if (result.success && result.data?.new_status) {
        toast.success(t(text.maintenanceSuccess));
        refresh();
      } else {
        const errorMsg = result.error?.message || t(text.maintenanceError);
        toast.error(errorMsg);
        console.error("Maintenance toggle failed:", result.error);
      }
    } catch (error) {
      console.error("Error updating maintenance status:", error);
      toast.error(t(text.maintenanceError));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminLayout title={t(text.title)}>
      <div className="space-y-4 p-4">
        <SlotFilters
          filterStatus={filterStatus}
          searchTerm={searchTerm}
          onFilterChange={setFilterStatus}
          onSearchChange={setSearchTerm}
        />

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t(text.loading)}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>{t(text.error)}: {error instanceof Error ? error.message : String(error)}</p>
             <Button onClick={refresh} variant="outline" size="sm" className="mt-2">
               {t(text.refreshButton)}
             </Button>
          </div>
        ) : (
          <SlotGrid
            slots={slots || []}
            selectedSlotId={selectedSlot?.id}
            onSlotClick={handleSlotClick}
            onToggleMaintenance={handleToggleMaintenance}
            enableActions={true}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default SlotManagementPage;
