import React, { useState, useEffect } from "react";
import {
  initializeSlotFolders,
  clearSlotImages,
  checkSlotFolderExists,
} from "../../utils/slotStorage";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import {
  logAdminAction,
  AuditAction,
  AuditResource,
} from "../../services/auditLog";
import { toast } from "../../utils/toast";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import { useLanguage } from "../../store/LanguageContext";

/**
 * Component for initializing and managing slot storage folders
 * - Initializes all 25 slot folders
 * - Allows clearing images from specific slots
 * - Shows status of storage operations
 */
const StorageInitializer: React.FC = () => {
  const { user, isAdmin } = useUnifiedAuth();
  const { t } = useLanguage();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info",
  );
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [initializedSlots, setInitializedSlots] = useState<
    Record<number, boolean>
  >({});

  // Check which slots are already initialized
  useEffect(() => {
    const checkSlots = async () => {
      // Only proceed with checks if user is an admin
      if (!isAdmin) return;

      const checks: Record<number, boolean> = {};

      for (let i = 1; i <= 25; i++) {
        const exists = await checkSlotFolderExists(i);
        checks[i] = exists;
      }

      setInitializedSlots(checks);
    };

    checkSlots();
  }, [isAdmin]);

  // Only admins should access this component
  if (!isAdmin) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-600 mb-2">
          Access Restricted
        </h3>
        <p className="text-sm text-red-500">
          {t({
            en: "Only administrators can access storage management functions.",
            fr: "Seuls les administrateurs peuvent accéder aux fonctions de gestion du stockage.",
          })}
        </p>
      </div>
    );
  }

  const handleInitializeSlots = async () => {
    try {
      setIsInitializing(true);
      setStatusMessage(
        t({
          en: "Initializing slot folders...",
          fr: "Initialisation des dossiers de slots...",
        }),
      );
      setMessageType("info");

      const result = await initializeSlotFolders();

      // Log the action
      await logAdminAction(AuditAction.CREATE, AuditResource.SLOT, "all", {
        result: result.success,
        message: result.message,
      });

      if (result.success) {
        setStatusMessage(result.message);
        setMessageType("success");
        toast.success(
          t({
            en: "Successfully initialized all slot folders",
            fr: "Tous les dossiers de slots ont été initialisés avec succès",
          }),
        );

        // Update initialized slots status
        const updatedSlots: Record<number, boolean> = {};
        for (let i = 1; i <= 25; i++) {
          updatedSlots[i] = true;
        }
        setInitializedSlots(updatedSlots);
      } else {
        setStatusMessage(result.message);
        setMessageType("error");
        toast.error(
          t({
            en: "Error initializing slot folders",
            fr: "Erreur lors de l'initialisation des dossiers de slots",
          }),
        );
      }
    } catch (error) {
      console.error("Error in initialization:", error);
      setStatusMessage(
        error instanceof Error ? error.message : "Unknown error",
      );
      setMessageType("error");
      toast.error(
        t({
          en: "Failed to initialize storage folders",
          fr: "Échec de l'initialisation des dossiers de stockage",
        }),
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleClearSlot = async () => {
    try {
      setIsClearing(true);
      setStatusMessage(
        t({
          en: `Clearing images from slot ${selectedSlot}...`,
          fr: `Suppression des images du slot ${selectedSlot}...`,
        }),
      );
      setMessageType("info");

      const result = await clearSlotImages(selectedSlot);

      // Log the action
      await logAdminAction(
        AuditAction.DELETE,
        AuditResource.IMAGE,
        selectedSlot.toString(),
        { result: result.success, message: result.message },
      );

      if (result.success) {
        setStatusMessage(result.message);
        setMessageType("success");
        toast.success(
          t({
            en: `Successfully cleared images from slot ${selectedSlot}`,
            fr: `Images du slot ${selectedSlot} supprimées avec succès`,
          }),
        );
      } else {
        setStatusMessage(result.message);
        setMessageType("error");
        toast.error(
          t({
            en: `Error clearing images from slot ${selectedSlot}`,
            fr: `Erreur lors de la suppression des images du slot ${selectedSlot}`,
          }),
        );
      }
    } catch (error) {
      console.error("Error clearing slot:", error);
      setStatusMessage(
        error instanceof Error ? error.message : "Unknown error",
      );
      setMessageType("error");
      toast.error(
        t({
          en: "Failed to clear slot images",
          fr: "Échec de la suppression des images du slot",
        }),
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">
        {t({
          en: "Slot Storage Management",
          fr: "Gestion du stockage des slots",
        })}
      </h2>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">
          {t({
            en: "Initialize All Slot Folders",
            fr: "Initialiser tous les dossiers de slots",
          })}
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          {t({
            en: "This will create all 25 slot folders in Supabase Storage if they don't already exist. This operation is safe to run multiple times and will not affect existing images.",
            fr: "Cela créera les 25 dossiers de slots dans le stockage Supabase s'ils n'existent pas déjà. Cette opération peut être exécutée plusieurs fois sans danger et n'affectera pas les images existantes.",
          })}
        </p>

        <div className="flex gap-4 items-center">
          <Button
            onClick={handleInitializeSlots}
            variant="primary"
            disabled={isInitializing}
            className="flex items-center gap-2"
          >
            {isInitializing && <Spinner size="sm" />}
            {t({
              en: "Initialize All Slot Folders",
              fr: "Initialiser tous les dossiers",
            })}
          </Button>

          <div className="text-sm">
            <span className="font-medium">
              {t({
                en: "Status:",
                fr: "Statut:",
              })}
            </span>{" "}
            {Object.values(initializedSlots).filter(Boolean).length} / 25{" "}
            {t({
              en: "folders exist",
              fr: "dossiers existent",
            })}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">
          {t({
            en: "Clear Images from Slot",
            fr: "Supprimer les images d'un slot",
          })}
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          {t({
            en: "This will remove all images from the selected slot folder while preserving the folder structure. Use this when removing a product from a slot or when manually cleaning up.",
            fr: "Cela supprimera toutes les images du dossier du slot sélectionné tout en préservant la structure du dossier. Utilisez cette fonction lors de la suppression d'un produit d'un slot ou lors d'un nettoyage manuel.",
          })}
        </p>

        <div className="flex gap-4 items-center">
          <div>
            <label
              htmlFor="slotSelect"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t({
                en: "Select Slot:",
                fr: "Sélectionner un slot:",
              })}
            </label>
            <select
              id="slotSelect"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(Number(e.target.value))}
              className="form-select block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {t({
                    en: `Slot ${num}`,
                    fr: `Slot ${num}`,
                  })}
                  {initializedSlots[num] ? "" : " (Not initialized)"}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleClearSlot}
            variant="danger"
            disabled={isClearing || !initializedSlots[selectedSlot]}
            className="flex items-center gap-2 mt-6"
          >
            {isClearing && <Spinner size="sm" />}
            {t({
              en: "Clear Images",
              fr: "Supprimer les images",
            })}
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-md mt-6 ${
            messageType === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : messageType === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          <p>{statusMessage}</p>
        </div>
      )}

      <div className="mt-8 text-xs text-gray-500">
        <p>
          {t({
            en: "Note: Storage operations require proper Supabase Storage permissions to work correctly.",
            fr: "Remarque: Les opérations de stockage nécessitent des autorisations de stockage Supabase appropriées pour fonctionner correctement.",
          })}
        </p>
      </div>
    </div>
  );
};

export default StorageInitializer;
