import { Slot } from "@/services/slots";
import { Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/utils/formatters";
import {
  ImageIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
  SettingsIcon,
} from "@/components/ui/Icons";
import { ActionItem } from "@/components/ui/ActionMenu";
import {
  SlotStatus,
  DraftStatus,
  getSlotStatusVariant,
  getSlotStatusText,
  getDraftStatusText,
} from "@/utils/slotUtils";

// Define types for handler functions to ensure type safety
// These now represent the CONFIRMATION trigger functions, not the core async logic
type ApproveDraftHandler = (slotId: number) => void;
type RejectDraftHandler = (slotId: number) => void;
type RemoveProductHandler = (slotId: number) => void;
type MaintenanceToggleHandler = (slotId: number, targetState: boolean) => void;

interface TableConfigDependencies {
  language: "en" | "fr";
  t: (key: { en: string; fr: string }, options?: any) => string;
  filterDraftStatus?: DraftStatus;
  isLoading: boolean;
  handleApproveDraft: ApproveDraftHandler;
  handleRejectDraft: RejectDraftHandler;
  handleRemoveProduct: RemoveProductHandler;
  handleMaintenanceToggle: MaintenanceToggleHandler;
}

export const getSlotTableColumns = ({
  language,
  t,
  filterDraftStatus,
}: Pick<
  TableConfigDependencies,
  "language" | "t" | "filterDraftStatus"
>): Column<Slot>[] => {
  // Define base columns common to both modes
  const baseColumns: Column<Slot>[] = [
    {
      id: "id",
      accessorKey: "id",
      header: t({ en: "ID", fr: "ID" }),
      width: 60,
    },
    // Only show slot_status column when NOT in approval mode
    ...(filterDraftStatus !== "ready_to_publish"
      ? [
          {
            id: "slot_status",
            accessorKey: "slot_status",
            header: t({ en: "Status", fr: "Statut" }),
            cell: (slot: Slot) => {
              const status = slot.slot_status as SlotStatus;
              const variant =
                status === "live"
                  ? "primary"
                  : status === "empty"
                    ? "success"
                    : status === "maintenance"
                      ? "error"
                      : "secondary";
              // Use translation for status text if needed
              const statusText = getSlotStatusText(status);
              return <Badge variant={variant}>{language === 'fr' ? statusText.fr : statusText.en}</Badge>;
            },
            enableSorting: true,
            width: 120,
          } as Column<Slot>,
        ]
      : []),
  ];

  let modeSpecificColumns: Column<Slot>[] = [];

  if (filterDraftStatus === "ready_to_publish") {
    // Columns for Approval Mode
    modeSpecificColumns = [
      {
        id: "draft_product_name",
        header: t({ en: "Draft Product", fr: "Produit Brouillon" }),
        cell: (slot: Slot) => {
          const productName =
            language === "en"
              ? slot.draft_product_name_en
              : slot.draft_product_name_fr;
          const imageUrl = slot.draft_product_image_urls?.[0];
          return (
            <div className="flex items-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={
                    productName ||
                    t({
                      en: "Draft product image",
                      fr: "Image produit brouillon",
                    })
                  }
                  className="w-8 h-8 object-cover rounded mr-2"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded mr-2 flex items-center justify-center text-gray-500">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
              <span className="truncate">{productName || "-"}</span>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "draft_product_price",
        accessorKey: "draft_product_price",
        header: t({ en: "Draft Price", fr: "Prix Brouillon" }),
        cell: (slot: Slot) => {
          if (slot.draft_product_price == null) return "-";
          // Consider formatting currency properly based on locale/currency
          return `${slot.draft_product_price.toLocaleString()} ${slot.draft_product_currency || ""}`;
        },
        enableSorting: true,
        width: 150,
      },
      {
        id: "draft_seller_whatsapp",
        accessorKey: "draft_seller_whatsapp_number",
        header: t({ en: "Seller WhatsApp", fr: "WhatsApp Vendeur" }),
        cell: (slot: Slot) => slot.draft_seller_whatsapp_number || "-",
        width: 180,
      },
      {
        id: "draft_updated_at",
        accessorKey: "draft_updated_at",
        header: t({ en: "Submitted", fr: "Soumis le" }),
        cell: (slot: Slot) => {
          if (!slot.draft_updated_at) return "-";
          try {
            return formatDateTime(new Date(slot.draft_updated_at), "relative");
          } catch (e) {
            console.error(
              "Error parsing draft_updated_at:",
              slot.draft_updated_at,
              e,
            );
            return t({ en: "Invalid date", fr: "Date invalide" });
          }
        },
        enableSorting: true,
        width: 150,
      },
    ];
  } else {
    // Columns for General Management Mode
    modeSpecificColumns = [
      {
        id: "live_product_name",
        header: t({ en: "Product Name", fr: "Nom du Produit" }),
        cell: (slot: Slot) => {
          if (slot.slot_status !== "live") return "-";
          const productName =
            language === "en"
              ? slot.live_product_name_en
              : slot.live_product_name_fr;
          const imageUrl = slot.live_product_image_urls?.[0];
          return (
            <div className="flex items-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={
                    productName ||
                    t({
                      en: "Live product image",
                      fr: "Image produit en ligne",
                    })
                  }
                  className="w-8 h-8 object-cover rounded mr-2"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded mr-2 flex items-center justify-center text-gray-500">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
              <span className="truncate">{productName || "-"}</span>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "live_product_price",
        accessorKey: "live_product_price",
        header: t({ en: "Price", fr: "Prix" }),
        cell: (slot: Slot) => {
          if (
            slot.slot_status !== "live" ||
            slot.live_product_price == null
          )
            return "-";
          return `${slot.live_product_price.toLocaleString()} ${slot.live_product_currency || ""}`;
        },
        enableSorting: true,
        width: 150,
      },
      {
        id: "end_time",
        accessorKey: "end_time",
        header: t({ en: "Ends In", fr: "Finit Dans" }),
        cell: (slot: Slot) => {
          if (slot.slot_status !== "live" || !slot.end_time)
            return "-";
          try {
            const endDate = new Date(slot.end_time);
            return formatDateTime(endDate, "relative");
          } catch (e) {
            console.error("Error parsing end_time:", slot.end_time, e);
            return t({ en: "Invalid date", fr: "Date invalide" });
          }
        },
        enableSorting: true,
        width: 150,
      },
    ];
  }

  return [...baseColumns, ...modeSpecificColumns];
};

export const getSlotRowActions = (
  slot: Slot,
  {
    t,
    filterDraftStatus,
    isLoading,
    handleApproveDraft,
    handleRejectDraft,
    handleRemoveProduct,
    handleMaintenanceToggle,
  }: Omit<TableConfigDependencies, "language">,
): ActionItem[] => {
  const actions: ActionItem[] = [];
  const iconClass = "w-4 h-4 mr-2"; // Define common icon class

  // --- Actions for Approval Mode ---
  if (filterDraftStatus === "ready_to_publish") {
    // Approve Action
    const approveAction: ActionItem = {
      label: t({ en: "Approve", fr: "Approuver" }),
      icon: <CheckIcon className={`${iconClass} text-green-600`} />,
      onClick: () => handleApproveDraft(slot.id),
      disabled: isLoading,
    };
    actions.push(approveAction);

    // Reject Action
    const rejectAction: ActionItem = {
      label: t({ en: "Reject", fr: "Rejeter" }),
      icon: <XIcon className={`${iconClass} text-red-600`} />,
      onClick: () => handleRejectDraft(slot.id),
      disabled: isLoading,
    };
    actions.push(rejectAction);
  }
  // --- Actions for General Management Mode ---
  else {
    // Edit Draft Action (Example - Add imports for EditIcon/navigate if used)
    // if (slot.draft_status === "drafting" || slot.draft_status === "empty") {
    //     const editAction: ActionItem = { label: t({en: "Edit Draft", fr: "Modifier Brouillon"}), icon: <EditIcon className={iconClass} />, onClick: () => navigate(`/admin/slots/${slot.id}/edit`) };
    //     actions.push(editAction);
    // }
    
    // Remove Product Action (Only for Live slots)
    if (slot.slot_status === "live") {
       const removeAction: ActionItem = {
        label: t({ en: "Remove Product", fr: "Retirer Produit" }),
        icon: <TrashIcon className={`${iconClass} text-red-600`} />,
        onClick: () => handleRemoveProduct(slot.id),
        disabled: isLoading,
      };
       actions.push(removeAction);
    }

    // Toggle Maintenance Action (Not for Live slots)
     if (slot.slot_status !== "live") {
        const isCurrentlyMaintenance = slot.slot_status === "maintenance";
        const toggleMaintenanceAction: ActionItem = {
          label: isCurrentlyMaintenance
            ? t({ en: "Clear Maintenance", fr: "Terminer Maintenance" })
            : t({ en: "Set Maintenance", fr: "Mettre en Maintenance" }),
          icon: <SettingsIcon className={iconClass} />,
          onClick: () => handleMaintenanceToggle(slot.id, !isCurrentlyMaintenance),
          disabled: isLoading,
        };
        actions.push(toggleMaintenanceAction);
     }
     
     // View Details Action (Example - Add imports for ViewIcon/navigate if used)
     // const viewAction: ActionItem = { label: t({en: "View Details", fr: "Voir Détails"}), icon: <ViewIcon className={iconClass} />, onClick: () => navigate(`/admin/slots/${slot.id}`) };
     // actions.push(viewAction);
  }

  return actions;
};
