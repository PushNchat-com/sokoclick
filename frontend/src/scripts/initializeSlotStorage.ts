/**
 * Script to initialize the slot folder structure in Supabase storage
 *
 * Run this script when setting up the application to create the slot-1 through slot-25
 * folder structure in the storage bucket.
 */
import { initializeSlotFolders } from "../utils/slotStorage";

console.log("Starting slot folder initialization...");

initializeSlotFolders()
  .then((result) => {
    if (result.success) {
      console.log("✅ Slot folders initialized successfully!");
    } else {
      console.error("❌ Failed to initialize slot folders:", result.message);
    }
  })
  .catch((error) => {
    console.error("❌ Unexpected error during initialization:", error);
  })
  .finally(() => {
    console.log("Initialization process completed.");
  });
