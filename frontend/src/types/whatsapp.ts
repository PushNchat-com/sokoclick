export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  PRODUCT = 'product',
  ORDER = 'order',
}

export enum MessageSender {
  USER = 'user',
  BUSINESS = 'business',
  SYSTEM = 'system',
}

export enum ConversationStatus {
  INITIATED = 'initiated',
  ACTIVE = 'active',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string | null;
  content: string;
  type?: MessageType | null;
  sender: string | null;
  timestamp: string;
  is_read: boolean | null;
  attachments?: string[] | null;
  metadata?: any;
  conversationId?: string;
  isRead?: boolean;
}

export interface WhatsAppConversation {
  id: string;
  buyer_id: string | null;
  seller_id: string | null;
  product_id: string | null;
  product_name: string | null;
  product_image: string | null;
  status: ConversationStatus;
  last_message: string | null;
  last_message_timestamp: string | null;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
  buyerId?: string;
  sellerId?: string;
  userId?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  messages?: WhatsAppMessage[];
  createdAt?: string;
  updatedAt?: string;
  threadId?: string;
}

export interface SendMessageParams {
  conversation_id: string;
  content: string;
  type?: MessageType;
  metadata?: {
    [key: string]: any;
  };
}

export interface UpdateConversationStatusParams {
  conversation_id: string;
  status: ConversationStatus;
}

export interface TransactionUpdate {
  conversationId: string;
  status: ConversationStatus;
  notes?: string;
  amount?: number;
  paymentMethod?: string;
  shippingInfo?: ShippingInfo;
}

export interface ShippingInfo {
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  address?: string;
} 