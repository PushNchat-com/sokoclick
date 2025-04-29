// Delivery option interface
export interface DeliveryOption {
  name_en: string;
  name_fr: string;
  areas: string[];
  estimated_days: number;
  fee: number;
}

export interface DeliveryOptionInternal extends DeliveryOption {
  id?: string;
  product_id?: string;
}

// Delivery status enum
export enum DeliveryStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  FAILED = "failed",
  CANCELED = "canceled",
}

// Shipping address interface
export interface ShippingAddress {
  id?: string;
  user_id?: string;
  name: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  phone: string;
  is_default?: boolean;
}
