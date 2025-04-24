export interface ProductFormData {
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  price: string;
  currency: 'XAF' | 'FCFA';
  seller_whatsapp: string;
  category_id: string;
  category?: string;
  condition: 'new' | 'used' | 'refurbished';
  image_urls: string[];
  slot_id?: string;
  slotNumber?: string;
  status?: ProductStatus;
}

export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'inactive';

export interface Product {
  id: string;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  price: number;
  currency: 'XAF' | 'FCFA';
  seller_whatsapp: string;
  category_id: string;
  condition: 'new' | 'used' | 'refurbished';
  image_urls: string[];
  slot_id?: string;
  seller_id: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductFormErrors {
  name_en?: string;
  name_fr?: string;
  description_en?: string;
  description_fr?: string;
  price?: string;
  currency?: string;
  seller_whatsapp?: string;
  category_id?: string;
  condition?: string;
  images?: string;
  slot_id?: string;
  submit?: string;
}

export type ProductFormStep = 1 | 2 | 3;

export type ProductFormState = 'idle' | 'validating' | 'saving' | 'submitting' | 'error' | 'success'; 