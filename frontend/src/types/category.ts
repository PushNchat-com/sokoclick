import { Product } from './product';

export interface Category {
  id: string;
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryWithProducts extends Category {
  products?: Product[];
}

export type CategoryId = Category['id']; 