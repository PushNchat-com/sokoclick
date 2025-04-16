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
  conversationId: string;
  content: string;
  type: MessageType;
  sender: MessageSender;
  timestamp: string;
  isRead: boolean;
  metadata?: {
    [key: string]: any;
  };
}

export interface WhatsAppConversation {
  id: string;
  buyerId: string;
  sellerId: string;
  userId: string;
  productId: string;
  productName: string;
  productImage?: string;
  status: ConversationStatus;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: WhatsAppMessage[];
  createdAt: string;
  updatedAt: string;
  threadId?: string;
}

export interface SendMessageParams {
  conversationId: string;
  content: string;
  type?: MessageType;
  metadata?: {
    [key: string]: any;
  };
}

export interface UpdateConversationStatusParams {
  conversationId: string;
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