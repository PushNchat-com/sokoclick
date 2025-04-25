import { DeliveryOptionInternal } from './delivery';
import type { ProductFormData } from './product';
export type { ProductFormData };

export interface UploadedImage {
  id?: string;
  url: string;
  path: string;
  size?: number;
  type?: string;
  name?: string;
}
