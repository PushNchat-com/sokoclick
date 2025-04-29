import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "../../store/LanguageContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  useSlots,
  slotService,
  Slot,
  useSlotStats,
} from "../../services/slots";
import { toast } from "../../utils/toast";
import {
  RefreshIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  UploadIcon,
  ChevronDownIcon,
  ImageIcon,
  TrashIcon,
  CheckIcon,
  SettingsIcon,
  XIcon,
} from "../ui/Icons";
import { useNavigate } from "react-router-dom";
import { DataTable, Column } from "../ui/DataTable";
import { Badge } from "../ui/Badge";
import { formatDateTime } from "../../utils/formatters";
import { ActionMenu, ActionItem } from "../ui/ActionMenu";
import { SlotCard } from "./slot-management/SlotCard";
import SlotGridConnected from "./SlotGridConnected";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

// Import the new components
import { SlotManagementToolbar } from "./slot-management/SlotManagementToolbar";
import { SlotManagementAdvancedFilters } from "./slot-management/SlotManagementAdvancedFilters";
import { SlotManagementBatchActions } from "./slot-management/SlotManagementBatchActions";
import { BatchProcessingIndicator } from "./slot-management/BatchProcessingIndicator";
import {
  getSlotTableColumns,
  getSlotRowActions,
} from "./slot-management/slotManagementTableConfig.tsx";
import { SlotStatus, DraftStatus } from "@/types/supabase-types"; // Import enums

interface SlotState {
  slots: Slot[];
  activeTab: string;
  searchTerm: string;
  filterByUser: string;
}

// --- Add props for approvals mode ---
interface SlotManagementProps {
  filterDraftStatus?: DraftStatus;
  refreshPendingCount?: () => void;
  refreshStats?: () => void;
  // Inherit stats and pending count if needed directly (optional)
  stats?: ReturnType<typeof useSlotStats>["stats"]; // Use correct type
  pendingApprovalsCount?: number;
}

const SlotManagement: React.FC<SlotManagementProps> = ({
  filterDraftStatus,
  refreshPendingCount,
  refreshStats: refreshStatsProp,
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { openConfirmDialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showAdvancedFilters, setShowAdvancedFilters] =
    useState<boolean>(false);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [filterByUser, setFilterByUser] = useState<string>("");

  // Batch operations state - Declared before useSlots
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    completed: number;
    success: number;
    failed: number;
  }>({
    total: 0,
    completed: 0,
    success: 0,
    failed: 0,
  });

  // Calculate filter status based on active tab
  const filterStatus = useMemo(() => {
    if (filterDraftStatus) return undefined;
    if (activeTab === "all") return undefined;
    return activeTab as SlotStatus;
  }, [activeTab, filterDraftStatus]);

  // Use the updated useSlots hook with filtering and search
  const { slots, loading, error, refresh } = useSlots(
    filterStatus,
    searchTerm,
    filterDraftStatus,
  );

  // --- State and Effects depending on 'slots' ---
  const [rowSelection, setRowSelection] = useState({}); // Local state for DataTable selection

  // Sync rowSelection with selectedSlots when selectedSlots changes externally
  useEffect(() => {
    const newRowSelection = selectedSlots.reduce(
      (acc, id) => {
        // Find the index of the slot in the current data array
        const index = slots.findIndex((slot) => slot.id === id);
        if (index !== -1) {
          acc[index] = true;
        }
        return acc;
      },
      {} as Record<string, boolean>,
    );
    setRowSelection(newRowSelection);
  }, [selectedSlots, slots]);

  // Update selectedSlots when DataTable selection changes
  useEffect(() => {
    const selectedIds = Object.entries(rowSelection)
      .filter(([, isSelected]) => isSelected)
      .map(([index]) => slots[parseInt(index)]?.id)
      .filter((id): id is number => id !== undefined); // Filter out undefined IDs

    // Avoid infinite loop by checking if the state actually needs updating
    if (
      JSON.stringify(selectedIds.sort()) !==
      JSON.stringify(selectedSlots.sort())
    ) {
      setSelectedSlots(selectedIds);
    }
  }, [rowSelection, slots, selectedSlots]);
  // --- End State and Effects depending on 'slots' ---

  // Get stats using the hook
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshSlotStatsHook,
  } = useSlotStats();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter changes
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
  };

  const handleFilterByUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterByUser(e.target.value);
  };

  const handleClearFilters = () => {
    setDateFilter("");
    setFilterByUser("");
  };

  const handleToggleAdvancedFilters = () => {
    setShowAdvancedFilters((prev) => !prev);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    refresh();
    refreshSlotStatsHook();
    if (
      filterDraftStatus === DraftStatus.ReadyToPublish &&
      refreshPendingCount
    ) {
      refreshPendingCount();
    } else if (refreshStatsProp) {
      refreshStatsProp();
    }

    toast.success(
      t({
        en: "Slots refreshed successfully",
        fr: "Emplacements actualisés avec succès",
      }),
    );
  };

  // Handle creating a new product
  const handleCreateProduct = () => {
    // Navigate to product creation page
    window.location.href = "/admin/products/create";
  };

  // Handle scheduling a slot
  const handleScheduleSlot = () => {
    // Navigate to slot scheduling page
    window.location.href = "/admin/slots/schedule";
  };

  // Handle navigate to slot uploads
  const handleNavigateToUploads = () => {
    navigate("/admin/slots/uploads");
  };

  // Handle slot actions with undo support
  /* // Removed reserve/cancel handlers
  const handleReserveSlot = async (slotId: number) => { ... };
  const handleCancelReservation = async (slotId: number) => { ... };
  */

  // Handle slot selection for batch operations
  const handleSlotSelection = (slotId: number, isSelected: boolean) => {
    setSelectedSlots((prev) =>
      isSelected ? [...prev, slotId] : prev.filter((id) => id !== slotId),
    );
  };

  // Handle select all slots - Now handled by DataTable internally
  // const handleSelectAllSlots = (isSelected: boolean) => { ... };

  // Handle batch maintenance toggle
  const handleBatchMaintenanceToggle = async (setMaintenance: boolean) => {
    if (selectedSlots.length === 0) return;
    setIsBatchProcessing(true);
    const initialProgress = {
      total: selectedSlots.length,
      completed: 0,
      success: 0,
      failed: 0,
    };
    setBatchProgress(initialProgress);
    let currentProgress = { ...initialProgress };
    const operationName = setMaintenance
      ? "set maintenance"
      : "clear maintenance";

    for (const slotId of selectedSlots) {
      let success = false;
      try {
        const response = await slotService.setSlotMaintenance(
          slotId,
          setMaintenance,
        );
        success = response.success;
        if (!success)
          console.error(`Failed for slot ${slotId}:`, response.error?.message);
      } catch (error) {
        console.error(
          `Error processing slot ${slotId} in batch maintenance:`,
          error,
        );
        success = false;
      } finally {
        currentProgress = {
          ...currentProgress,
          completed: currentProgress.completed + 1,
          success: success
            ? currentProgress.success + 1
            : currentProgress.success,
          failed: !success
            ? currentProgress.failed + 1
            : currentProgress.failed,
        };
        setBatchProgress(currentProgress);
      }
    }

    toast.info(
      t({
        en: `Batch ${operationName}: ${currentProgress.success} succeeded, ${currentProgress.failed} failed.`,
        fr: `Traitement par lot (${operationName}): ${currentProgress.success} succès, ${currentProgress.failed} échecs.`,
      }),
    );
    setIsBatchProcessing(false);
    setSelectedSlots([]);
    refresh();
    refreshStatsProp?.();
  };

  // Handle batch delete/remove product
  const handleBatchRemoveProduct = async () => {
    if (selectedSlots.length === 0) return;

    // Filter selected slots to only include those that are currently 'live'
    const liveSlotsToRemove = slots
      .filter(
        (slot) =>
          selectedSlots.includes(slot.id) &&
          slot.slot_status === SlotStatus.Live,
      )
      .map((slot) => slot.id);

    if (liveSlotsToRemove.length === 0) {
      toast.info(
        t({
          en: "No selected slots have live products to remove.",
          fr: "Aucun emplacement sélectionné n'a de produit actif à retirer.",
        }),
      );
      setSelectedSlots([]); // Clear selection as there's nothing to do
      setRowSelection({});
      return;
    }

    // Add confirmation dialog for batch removal
    if (
      !window.confirm(
        t({
          en: `Are you sure you want to remove products from ${liveSlotsToRemove.length} selected slot(s)? This cannot be undone.`,
          fr: `Êtes-vous sûr de vouloir retirer les produits de ${liveSlotsToRemove.length} emplacement(s) sélectionné(s) ? Cette action est irréversible.`,
        }),
      )
    ) {
      return; // Abort if user cancels
    }

    setIsBatchProcessing(true);
    // Filter selected slots to only include those that are currently 'live' and thus have a product to remove.
    /* // Redundant filtering - already done above
    const liveSlotsToRemove = slots
      .filter(slot => selectedSlots.includes(slot.id) && slot.slot_status === 'live')
      .map(slot => slot.id);
    */
    /* // Redundant check - already done above
    if (liveSlotsToRemove.length === 0) {
       toast.info(t({ en: "No selected slots have live products to remove.", fr: "Aucun emplacement sélectionné n'a de produit actif à retirer." }));
       setIsBatchProcessing(false);
       setSelectedSlots([]);
       return;
    }
    */

    const initialProgress = {
      total: liveSlotsToRemove.length,
      completed: 0,
      success: 0,
      failed: 0,
    };
    setBatchProgress(initialProgress);
    let currentProgress = { ...initialProgress };
    const operationName = "remove products";

    for (const slotId of liveSlotsToRemove) {
      let success = false;
      try {
        const response = await slotService.removeProductFromSlot(slotId);
        success = response.success;
        if (!success)
          console.error(`Failed for slot ${slotId}:`, response.error?.message);
      } catch (error) {
        console.error(
          `Error processing slot ${slotId} in batch remove:`,
          error,
        );
        success = false;
      } finally {
        currentProgress = {
          ...currentProgress,
          completed: currentProgress.completed + 1,
          success: success
            ? currentProgress.success + 1
            : currentProgress.success,
          failed: !success
            ? currentProgress.failed + 1
            : currentProgress.failed,
        };
        setBatchProgress(currentProgress);
      }
    }

    toast.info(
      t({
        en: `Batch ${operationName}: ${currentProgress.success} succeeded, ${currentProgress.failed} failed.`,
        fr: `Traitement par lot (${operationName}): ${currentProgress.success} succès, ${currentProgress.failed} échecs.`,
      }),
    );
    setIsBatchProcessing(false);
    setSelectedSlots([]);
    refresh();
    refreshStatsProp?.();
  };

  // --- CUT START: Move these function definitions before columns/memoizedRowActions ---
  // --- Core Action Handlers ---
  const handleApproveDraft = async (
    slotId: number,
    sellerId: string | undefined,
  ) => {
    setIsLoading(true);
    if (!sellerId) {
      toast.error(
        t({
          en: "Cannot approve: Seller ID is missing.",
          fr: "Approbation impossible : ID du vendeur manquant.",
        }),
      );
      setIsLoading(false);
      return;
    }
    const result = await slotService.publishDraftToLive(slotId, 7, sellerId);
    if (result.success) {
      toast.success(
        t({
          en: `Slot ${slotId} approved successfully`,
          fr: `Emplacement ${slotId} approuvé avec succès`,
        }),
      );
      refresh();
      refreshPendingCount?.();
      refreshSlotStatsHook();
    } else {
      toast.error(
        result.error?.message ||
          t({
            en: "Failed to approve slot",
            fr: "Échec de l'approbation de l'emplacement",
          }),
      );
    }
    setIsLoading(false);
  };

  const handleRejectDraft = async (slotId: number) => {
    setIsLoading(true);
    const result = await slotService.rejectDraft(slotId);
    if (result.success) {
      toast.success(
        t({
          en: `Draft for slot ${slotId} rejected successfully`,
          fr: `Brouillon pour l'emplacement ${slotId} rejeté avec succès`,
        }),
      );
      refresh();
      refreshPendingCount?.();
      refreshSlotStatsHook();
    } else {
      toast.error(
        result.error?.message ||
          t({
            en: "Failed to reject draft",
            fr: "Échec du rejet du brouillon",
          }),
      );
    }
    setIsLoading(false);
  };

  const handleMaintenanceToggle = async (
    slotId: number,
    targetMaintenanceState: boolean,
  ) => {
    setIsLoading(true);
    const result = await slotService.setSlotMaintenance(
      slotId,
      targetMaintenanceState,
    );
    if (result.success) {
      toast.success(
        t({
          en: `Slot ${slotId} ${targetMaintenanceState ? "set to maintenance" : "cleared from maintenance"}`,
          fr: `Emplacement ${slotId} ${targetMaintenanceState ? "mis en maintenance" : "retiré de la maintenance"}`,
        }),
      );
      refresh();
      refreshStatsProp?.();
      refreshSlotStatsHook();
    } else {
      toast.error(
        result.error?.message ||
          t({
            en: "Failed to toggle maintenance mode",
            fr: "Échec du changement de mode maintenance",
          }),
      );
    }
    setIsLoading(false);
  };

  const handleRemoveProduct = async (slotId: number) => {
    setIsLoading(true);
    const result = await slotService.removeProductFromSlot(slotId);
    if (result.success) {
      toast.success(
        t({
          en: "Product removed successfully",
          fr: "Produit retiré avec succès",
        }),
      );
      refresh();
      refreshStatsProp?.();
      refreshSlotStatsHook();
    } else {
      toast.error(
        result.error?.message ||
          t({
            en: "Failed to remove product",
            fr: "Échec du retrait du produit",
          }),
      );
    }
    setIsLoading(false);
  };

  // --- Confirmation Dialog Trigger Functions (using useConfirmDialog) ---
  const confirmApproveDraft = (
    slotId: number,
    sellerId: string | undefined,
  ) => {
    openConfirmDialog({
      title: t({ en: "Confirm Approval", fr: "Confirmer l'Approbation" }),
      message: t({
        en: `Are you sure you want to approve the draft for slot ${slotId}?`,
        fr: `Êtes-vous sûr de vouloir approuver le brouillon pour l\'emplacement ${slotId} ?`,
      }),
      confirmText: t({ en: "Approve", fr: "Approuver" }),
      confirmVariant: "primary",
      onConfirm: () => handleApproveDraft(slotId, sellerId),
    });
  };

  const confirmRejectDraft = (slotId: number) => {
    openConfirmDialog({
      title: t({ en: "Confirm Rejection", fr: "Confirmer le Rejet" }),
      message: t({
        en: `Are you sure you want to reject the draft for slot ${slotId}? This action cannot be undone easily.`,
        fr: `Êtes-vous sûr de vouloir rejeter le brouillon pour l\'emplacement ${slotId} ? Cette action ne peut pas être annulée facilement.`,
      }),
      confirmText: t({ en: "Confirm", fr: "Confirmer" }),
      confirmVariant: "danger",
      onConfirm: () => handleRejectDraft(slotId),
    });
  };

  const confirmRemoveProduct = (slotId: number) => {
    openConfirmDialog({
      title: t({ en: "Confirm Removal", fr: "Confirmer la Suppression" }),
      message: t({
        en: `Are you sure you want to remove the product from slot ${slotId}? This will make the slot empty.`,
        fr: `Êtes-vous sûr de vouloir retirer le produit de l\'emplacement ${slotId} ? Cela rendra l\'emplacement vide.`,
      }),
      confirmText: t({ en: "Confirm", fr: "Confirmer" }),
      confirmVariant: "danger",
      onConfirm: () => handleRemoveProduct(slotId),
    });
  };

  const confirmMaintenanceToggle = (slotId: number, targetState: boolean) => {
    const isSettingMaintenance = targetState;
    openConfirmDialog({
      title: isSettingMaintenance
        ? t({
            en: "Confirm Set Maintenance",
            fr: "Confirmer la Mise en Maintenance",
          })
        : t({
            en: "Confirm Clear Maintenance",
            fr: "Confirmer la Fin de Maintenance",
          }),
      message: isSettingMaintenance
        ? t({
            en: `Are you sure you want to set slot ${slotId} to maintenance mode? It will not be visible to users.`,
            fr: `Êtes-vous sûr de vouloir mettre l\'emplacement ${slotId} en mode maintenance ? Il ne sera pas visible par les utilisateurs.`,
          })
        : t({
            en: `Are you sure you want to clear maintenance mode for slot ${slotId}?`,
            fr: `Êtes-vous sûr de vouloir retirer le mode maintenance pour l\'emplacement ${slotId} ?`,
          }),
      confirmText: isSettingMaintenance
        ? t({ en: "Set Maintenance", fr: "Mettre en Maintenance" })
        : t({ en: "Clear Maintenance", fr: "Terminer Maintenance" }),
      confirmVariant: "primary",
      onConfirm: () => handleMaintenanceToggle(slotId, targetState),
    });
  };
  // --- CUT END ---

  // --- Batch Approval/Rejection ---
  const handleBatchApprove = async () => {
    if (
      selectedSlots.length === 0 ||
      filterDraftStatus !== DraftStatus.ReadyToPublish
    )
      return;

    const slotsToApprove = slots.filter(
      (slot) =>
        selectedSlots.includes(slot.id) &&
        slot.draft_status === DraftStatus.ReadyToPublish &&
        slot.draft_seller_id, // Ensure seller ID exists
    );

    if (slotsToApprove.length === 0) {
      toast.info(
        t({
          en: "No selected slots are ready for approval or missing seller ID.",
          fr: "Aucun emplacement sélectionné n'est prêt pour l'approbation ou l'ID du vendeur est manquant.",
        }),
      );
      return;
    }

    setIsBatchProcessing(true);
    const initialProgress = {
      total: slotsToApprove.length,
      completed: 0,
      success: 0,
      failed: 0,
    };
    setBatchProgress(initialProgress);
    let currentProgress = { ...initialProgress };
    const operationName = "approve drafts";

    for (const slot of slotsToApprove) {
      let success = false;
      try {
        // Assuming publishDraftToLive takes slotId, duration (e.g., 7 days), and sellerId
        const response = await slotService.publishDraftToLive(
          slot.id,
          7,
          slot.draft_seller_id!,
        );
        success = response.success;
        if (!success)
          console.error(
            `Failed to approve slot ${slot.id}:`,
            response.error?.message,
          );
      } catch (error) {
        console.error(`Error approving slot ${slot.id}:`, error);
        success = false;
      } finally {
        currentProgress = {
          ...currentProgress,
          completed: currentProgress.completed + 1,
          success: success
            ? currentProgress.success + 1
            : currentProgress.success,
          failed: !success
            ? currentProgress.failed + 1
            : currentProgress.failed,
        };
        setBatchProgress(currentProgress);
      }
    }

    toast.info(
      t({
        en: `Batch ${operationName}: ${currentProgress.success} succeeded, ${currentProgress.failed} failed.`,
        fr: `Traitement par lot (${operationName}): ${currentProgress.success} succès, ${currentProgress.failed} échecs.`,
      }),
    );
    setIsBatchProcessing(false);
    setSelectedSlots([]);
    setRowSelection({}); // Clear table selection
    refresh();
    refreshStatsProp?.();
    refreshPendingCount?.();
  };

  const handleBatchReject = async () => {
    if (
      selectedSlots.length === 0 ||
      filterDraftStatus !== DraftStatus.ReadyToPublish
    )
      return;

    const slotsToReject = slots.filter(
      (slot) =>
        selectedSlots.includes(slot.id) &&
        slot.draft_status === DraftStatus.ReadyToPublish,
    );

    if (slotsToReject.length === 0) {
      toast.info(
        t({
          en: "No selected slots are currently awaiting approval.",
          fr: "Aucun emplacement sélectionné n'est actuellement en attente d'approbation.",
        }),
      );
      setSelectedSlots([]); // Clear selection
      setRowSelection({});
      return;
    }

    // Add confirmation dialog for batch rejection
    if (
      !window.confirm(
        t({
          en: `Are you sure you want to reject ${slotsToReject.length} selected draft(s)?`,
          fr: `Êtes-vous sûr de vouloir rejeter ${slotsToReject.length} brouillon(s) sélectionné(s) ?`,
        }),
      )
    ) {
      return; // Abort if user cancels
    }

    setIsBatchProcessing(true);
    const initialProgress = {
      total: slotsToReject.length,
      completed: 0,
      success: 0,
      failed: 0,
    };
    setBatchProgress(initialProgress);
    let currentProgress = { ...initialProgress };
    const operationName = "reject drafts";

    for (const slot of slotsToReject) {
      let success = false;
      try {
        const response = await slotService.rejectDraft(slot.id);
        success = response.success;
        if (!success)
          console.error(
            `Failed to reject slot ${slot.id}:`,
            response.error?.message,
          );
      } catch (error) {
        console.error(`Error rejecting slot ${slot.id}:`, error);
        success = false;
      } finally {
        currentProgress = {
          ...currentProgress,
          completed: currentProgress.completed + 1,
          success: success
            ? currentProgress.success + 1
            : currentProgress.success,
          failed: !success
            ? currentProgress.failed + 1
            : currentProgress.failed,
        };
        setBatchProgress(currentProgress);
      }
    }

    toast.info(
      t({
        en: `Batch ${operationName}: ${currentProgress.success} succeeded, ${currentProgress.failed} failed.`,
        fr: `Traitement par lot (${operationName}): ${currentProgress.success} succès, ${currentProgress.failed} échecs.`,
      }),
    );
    setIsBatchProcessing(false);
    setSelectedSlots([]);
    setRowSelection({}); // Clear table selection
    refresh();
    refreshStatsProp?.();
    refreshPendingCount?.();
  };
  // --- End Batch Approval/Rejection ---

  // Use helper functions for table configuration
  const columns = useMemo<Column<Slot>[]>(
    () =>
      getSlotTableColumns({
        language,
        t,
        filterDraftStatus,
      }),
    [language, t, filterDraftStatus],
  );

  // Define row actions using the helper
  // Note: The helper function needs the specific slot, so we pass it inside the DataTable `rowActions` prop
  const memoizedRowActions = useCallback(
    (slot: Slot) => (
      <ActionMenu
        actions={getSlotRowActions(slot, {
          t,
          filterDraftStatus,
          isLoading,
          // Pass the confirmation trigger functions instead of the core handlers
          handleApproveDraft: confirmApproveDraft,
          handleRejectDraft: confirmRejectDraft,
          handleRemoveProduct: confirmRemoveProduct,
          handleMaintenanceToggle: confirmMaintenanceToggle,
          // slot is passed as first argument to getSlotRowActions now
        })}
      />
    ),
    // Update dependencies to include the confirmation functions
    [
      t,
      filterDraftStatus,
      isLoading,
      confirmApproveDraft,
      confirmRejectDraft,
      confirmRemoveProduct,
      confirmMaintenanceToggle,
    ],
  );

  // Toolbar JSX for DataTable - Defined as a regular function
  const renderToolbarContent = () => {
    const selectionCount = selectedSlots.length;
    const totalRowCount = slots?.length || 0;

    return (
      <div className="p-2 flex justify-between items-center border-b mb-2">
        {/* Left side: Selection count */}
        <span className="text-sm text-gray-600">
          {selectionCount > 0
            ? t({
                en: `${selectionCount} of ${totalRowCount} row(s) selected.`,
                fr: `${selectionCount} sur ${totalRowCount} ligne(s) sélectionnée(s).`,
              })
            : t({ en: `${totalRowCount} rows`, fr: `${totalRowCount} lignes` })}
        </span>

        {/* Right side: Deselect button */}
        {selectionCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRowSelection({});
              setSelectedSlots([]);
            }} // Clear both local and main selection state
            disabled={isBatchProcessing}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {t({ en: "Clear Selection", fr: "Effacer la sélection" })}
          </Button>
        )}
      </div>
    );
  };

  // Handle tab change - update activeTab state
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Determine title based on mode
  const pageTitle =
    filterDraftStatus === DraftStatus.ReadyToPublish
      ? t({ en: "Pending Approvals", fr: "Approbations en Attente" })
      : t({ en: "Slot Management", fr: "Gestion des Emplacements" });

  // Clear selection handler for the batch actions bar
  const handleClearSelection = () => {
    setRowSelection({});
    setSelectedSlots([]);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        {/* Hide view mode toggle and schedule button in approval mode */}
        {!filterDraftStatus && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setViewMode(viewMode === "table" ? "grid" : "table")
              }
            >
              {viewMode === "table"
                ? t({
                    en: "Grid View",
                    fr: "Vue en grille",
                  })
                : t({
                    en: "Table View",
                    fr: "Vue en tableau",
                  })}
            </Button>
            <Button variant="primary" onClick={handleScheduleSlot}>
              <CalendarIcon className="w-4 h-4 mr-1" />
              {t({
                en: "Schedule Slot",
                fr: "Planifier un emplacement",
              })}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        {/* === Use the new SlotManagementToolbar component === */}
        <SlotManagementToolbar
          filterDraftStatus={filterDraftStatus}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          stats={stats} // Pass stats from useSlotStats hook
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={handleToggleAdvancedFilters}
          onRefresh={handleRefresh}
          isLoading={loading || isLoading || statsLoading} // Combine loading states
        />

        {/* === Use the new SlotManagementAdvancedFilters component === */}
        {/* Conditionally render based on showAdvancedFilters AND not being in approval mode */}
        {!filterDraftStatus && showAdvancedFilters && (
          <SlotManagementAdvancedFilters
            dateFilter={dateFilter}
            onDateFilterChange={handleDateFilterChange}
            filterByUser={filterByUser}
            onFilterByUserChange={handleFilterByUserChange}
            onClearFilters={handleClearFilters}
          />
        )}

        {/* === Use the new SlotManagementBatchActions component === */}
        {selectedSlots.length > 0 && !isBatchProcessing && (
          <SlotManagementBatchActions
            selectedCount={selectedSlots.length}
            filterDraftStatus={filterDraftStatus}
            isBatchProcessing={isBatchProcessing}
            onBatchApprove={handleBatchApprove}
            onBatchReject={handleBatchReject}
            onBatchSetMaintenance={() => handleBatchMaintenanceToggle(true)}
            onBatchClearMaintenance={() => handleBatchMaintenanceToggle(false)}
            onBatchRemoveProduct={handleBatchRemoveProduct}
            onClearSelection={handleClearSelection}
          />
        )}

        {/* === Use the new BatchProcessingIndicator component === */}
        {isBatchProcessing && (
          <BatchProcessingIndicator batchProgress={batchProgress} />
        )}

        {/* Table View - Render Toolbar above */}
        {viewMode === "table" && renderToolbarContent()}

        {/* Table/Grid View */}
        <div className="mt-4">
          {viewMode === "table" ? (
            <DataTable<Slot>
              keyField="id"
              columns={columns}
              data={slots || []}
              isLoading={loading || isLoading || statsLoading} // Combine loading states
              rowActions={memoizedRowActions} // Use the memoized row actions function
              enableRowSelection // Enable selection in DataTable
              rowSelection={rowSelection} // Pass local selection state
              onRowSelectionChange={setRowSelection} // Update local selection state
              emptyState={t({
                en: "No slots found matching your criteria.",
                fr: "Aucun emplacement trouvé correspondant à vos critères.",
              })}
            />
          ) : (
            <SlotGridConnected
              key={activeTab}
              filterStatus={filterStatus}
              searchTerm={searchTerm}
              enableActions={true}
            />
          )}
        </div>
      </div>

      {/* Hide bottom buttons in approval mode */}
      {!filterDraftStatus && (
        <div className="flex justify-between">
          <div></div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleNavigateToUploads}>
              <UploadIcon className="w-4 h-4 mr-1" />
              {t({
                en: "Manage Uploads",
                fr: "Gérer les téléchargements",
              })}
            </Button>
            <Button variant="primary" onClick={handleCreateProduct}>
              {t({
                en: "Create New Product",
                fr: "Créer un nouveau produit",
              })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotManagement;
