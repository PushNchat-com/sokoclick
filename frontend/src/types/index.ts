export interface UploadedImage {
  id?: string;
  url: string;
  path: string;
  size?: number;
  type?: string;
  name?: string;
}

export interface DeliveryOption {
  id: string;
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  price: number;
  is_default: boolean;
}

export interface DeliveryOptionInternal extends Omit<DeliveryOption, 'id'> {
  id?: string;
  product_id?: string;
}

export interface ProductFormData {
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  price: number;
  seller_whatsapp: string;
  category_id: string;
  images: UploadedImage[];
  slot_id?: string;
  delivery_options: DeliveryOptionInternal[];
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected';
}
