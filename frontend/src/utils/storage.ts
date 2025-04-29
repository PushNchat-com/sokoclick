import { supabase } from "@/services/supabase";

interface UploadOptions {
  userId: string;
  isAdmin: boolean;
  productId?: string;
}

/**
 * Generates a storage path for product images
 */
export const getProductImagePath = (
  file: File,
  { userId, isAdmin, productId }: UploadOptions,
) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileName = `${randomId}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  if (isAdmin) {
    return `admin/${userId}/${productId || "new"}/${fileName}`;
  }

  return `sellers/${userId}/${productId || "new"}/${fileName}`;
};

/**
 * Uploads a product image to storage
 */
export const uploadProductImage = async (
  file: File,
  options: UploadOptions,
): Promise<{ url: string }> => {
  const path = getProductImagePath(file, options);

  const { error, data } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  return { url: publicUrl };
};

/**
 * Deletes a product image from storage
 */
export const deleteProductImage = async (url: string) => {
  const path = url.split("/").slice(-4).join("/"); // Extract path from URL

  const { error } = await supabase.storage
    .from("product-images")
    .remove([path]);

  if (error) {
    throw error;
  }
};
