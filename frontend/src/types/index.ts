import { DeliveryOptionInternal } from "./delivery";
import type { ProductFormData } from "./product";
export type { ProductFormData };

export interface UploadedImage {
  id?: string;
  url: string;
  path: string;
  size?: number;
  type?: string;
  name?: string;
}

export type { User, Session } from "@supabase/supabase-js";
export * from "./auth";
export * from "./product";
export * from "./category";
export * from "./image";
export * from "./delivery";
export * from "./router";
export * from "./supabase-types";
export * from "./translations";
