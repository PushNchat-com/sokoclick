import { BadgeProps } from "@/components/ui/Badge";
import { TranslationObject } from "@/store/LanguageContext";
import React from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import Badge from "@/components/ui/Badge";
import type { Slot } from "@/services/slots";

// Define status types locally based on known schema values
export type SlotStatus = "live" | "empty" | "maintenance";
export type DraftStatus = "empty" | "drafting" | "ready_to_publish";

// Slot Status Utilities
const slotStatusVariantMap: Record<SlotStatus, BadgeProps["variant"]> = {
  empty: "success",
  live: "primary",
  maintenance: "error",
};

const slotStatusTextMap: Record<SlotStatus, TranslationObject> = {
  empty: { en: "Empty", fr: "Vide" },
  live: { en: "Live", fr: "En Ligne" },
  maintenance: { en: "Maintenance", fr: "Maintenance" },
};

export const getSlotStatusVariant = (
  status: SlotStatus | string | undefined | null
): BadgeProps["variant"] =>
  slotStatusVariantMap[status as SlotStatus] || "secondary";

export const getSlotStatusText = (
  status: SlotStatus | string | undefined | null
): TranslationObject =>
  slotStatusTextMap[status as SlotStatus] || { en: "Unknown", fr: "Inconnu" };

// Draft Status Utilities
const draftStatusTextMap: Record<DraftStatus, TranslationObject> = {
  empty: { en: "Empty", fr: "Vide" },
  drafting: { en: "Drafting", fr: "En cours" },
  ready_to_publish: { en: "Ready", fr: "Prêt" },
};

export const getDraftStatusText = (
  status: DraftStatus | string | undefined | null
): TranslationObject =>
  draftStatusTextMap[status as DraftStatus] || { en: "Unknown", fr: "Inconnu" };

// Time Formatting
type TFunction = (textObj: TranslationObject) => string;

export const formatTimeLeft = (
  endTime: string | null | undefined,
  t: TFunction,
  language: "en" | "fr"
): string | null => {
  if (!endTime) return null;

  try {
    const endDate = new Date(endTime);
    const now = new Date();
    if (endDate <= now) return t({ en: "Ended", fr: "Terminé" });

    return formatDistanceToNowStrict(endDate, {
      addSuffix: true,
      locale: language === "fr" ? fr : enUS,
    });
  } catch (error) {
    console.error("Failed to format time:", error);
    return t({ en: "Invalid date", fr: "Date invalide" });
  }
};

// Status Badge Component (Corrected Implementation)
export const getSlotStatusBadge = (
  status: Slot["slot_status"],
  t: TFunction
): React.ReactElement => {
  let text: TranslationObject = { en: "Unknown", fr: "Inconnu" };
  let variant: BadgeProps["variant"] = "secondary";

  switch (status) {
    case "live":
      text = { en: "Live", fr: "En Ligne" };
      variant = "primary";
      break;
    case "maintenance":
      text = { en: "Maintenance", fr: "Maintenance" };
      variant = "error";
      break;
    case "empty":
      text = { en: "Empty", fr: "Vide" };
      variant = "success";
      break;
  }

  return React.createElement(React.Fragment, null, t(text));
};

// Helper Functions
export const isSlotEditable = (status: SlotStatus): boolean =>
  status === "empty"; 