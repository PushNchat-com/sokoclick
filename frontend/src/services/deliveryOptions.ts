import { supabase } from "@/services/supabase";
import { DeliveryOptionInternal } from "../types/delivery";

// Helper function to create delivery options
export const createDeliveryOption = async (
  option: DeliveryOptionInternal & { product_id: string },
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("delivery_options")
      .insert([option])
      .select();

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (err) {
    console.error("Error creating delivery option:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

// Helper function to update delivery options
export const updateDeliveryOption = async (
  optionId: string,
  option: Partial<DeliveryOptionInternal>,
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("delivery_options")
      .update(option)
      .eq("id", optionId)
      .select();

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (err) {
    console.error("Error updating delivery option:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

// Helper function to delete delivery options
export const deleteDeliveryOption = async (optionId: string): Promise<any> => {
  try {
    const { error } = await supabase
      .from("delivery_options")
      .delete()
      .eq("id", optionId);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err) {
    console.error("Error deleting delivery option:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};
