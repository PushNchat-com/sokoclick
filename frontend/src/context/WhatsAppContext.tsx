import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { WhatsAppConversation, ConversationStatus, TransactionUpdate, WhatsAppMessage, MessageType } from '../types/whatsapp';
import { supabaseClient } from '../lib/supabase';

// Default WhatsApp number to use when no specific number is provided
export const DEFAULT_WHATSAPP_NUMBER = '237673870377';

interface WhatsAppContextType {
  conversations: WhatsAppConversation[];
  loading: boolean;
  error: string | null;
  initiateConversation: (productId: string, sellerId: string, productName: string, productImage: string | null) => Promise<string | null>;
  getConversationById: (conversationId: string) => WhatsAppConversation | null;
  getMessages: (conversationId: string) => Promise<WhatsAppMessage[]>;
  sendMessage: (conversationId: string, content: string, attachments?: string[]) => Promise<boolean>;
  markAsRead: (conversationId: string) => Promise<void>;
  updateTransactionStatus: (update: TransactionUpdate) => Promise<boolean>;
  getWhatsAppShareLink: (phoneNumber: string | undefined, message: string) => string;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (context === undefined) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};

// Mock data for direct WhatsApp fallback
const MOCK_CONVERSATIONS: WhatsAppConversation[] = [];

export const WhatsAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useDirectWhatsAppFallback, setUseDirectWhatsAppFallback] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setLoading(false);
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user || useDirectWhatsAppFallback) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Check first if the table exists to avoid multiple error handling
      const { error: checkError } = await supabaseClient
        .from('whatsapp_conversations')
        .select('id')
        .limit(1);

      // If the table doesn't exist, use the fallback immediately
      if (checkError && (checkError.code === '404' || checkError.message?.includes('does not exist'))) {
        console.warn('WhatsApp conversations table not found, using direct WhatsApp fallback');
        setUseDirectWhatsAppFallback(true);
        setConversations(MOCK_CONVERSATIONS);
        setLoading(false);
        return;
      }

      // If we got here, the table exists, so proceed with the query
      const { data, error } = await supabaseClient
        .from('whatsapp_conversations')
        .select('*')
        .or('buyer_id.eq.' + user.id + ',seller_id.eq.' + user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      } else {
        // Ensure the data conforms to WhatsAppConversation type
        const typedConversations: WhatsAppConversation[] = data?.map(item => ({
          id: item.id,
          buyer_id: item.buyer_id,
          seller_id: item.seller_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          status: (item.status || ConversationStatus.INITIATED) as ConversationStatus,
          last_message: item.last_message,
          last_message_timestamp: item.last_message_timestamp,
          thread_id: item.thread_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
        })) || [];
        
        setConversations(typedConversations);
      }
    } catch (error: any) {
      console.error('Error fetching WhatsApp conversations:', error);
      setError(t('errors.failedToFetchConversations'));
      // Fallback to empty conversations array
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const initiateConversation = async (
    productId: string, 
    sellerId: string, 
    productName: string, 
    productImage: string | null
  ): Promise<string | null> => {
    if (!user) return null;

    // If we're using direct WhatsApp fallback, don't try to use Supabase
    if (useDirectWhatsAppFallback) {
      return null; // This will trigger the direct WhatsApp integration
    }

    try {
      // Check if conversation already exists
      const { data: existingConv, error: searchError } = await supabaseClient
        .from('whatsapp_conversations')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .single();

      // If table doesn't exist, use direct WhatsApp
      if (searchError && (searchError.code === '404' || searchError.message?.includes('does not exist'))) {
        setUseDirectWhatsAppFallback(true);
        return null;
      }

      if (existingConv) return existingConv.id;

      // Create new conversation
      const threadId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const { data, error } = await supabaseClient
        .from('whatsapp_conversations')
        .insert({
          product_id: productId,
          buyer_id: user.id,
          seller_id: sellerId,
          thread_id: threadId,
          product_name: productName,
          product_image: productImage,
          status: ConversationStatus.INITIATED,
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, use direct WhatsApp
        if (error.code === '404' || error.message?.includes('does not exist')) {
          setUseDirectWhatsAppFallback(true);
          return null;
        }
        throw error;
      }
      
      const newConversation: WhatsAppConversation = {
        id: data.id,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        product_id: data.product_id,
        product_name: data.product_name,
        product_image: data.product_image,
        status: (data.status || ConversationStatus.INITIATED) as ConversationStatus,
        last_message: data.last_message,
        last_message_timestamp: data.last_message_timestamp,
        thread_id: data.thread_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setConversations([newConversation, ...conversations]);
      return data.id;
    } catch (error: any) {
      console.error('Error initiating conversation:', error);
      setError(t('errors.failedToInitiateConversation'));
      return null;
    }
  };

  const getConversationById = (conversationId: string): WhatsAppConversation | null => {
    return conversations.find(conv => conv.id === conversationId) || null;
  };

  const getMessages = async (conversationId: string): Promise<WhatsAppMessage[]> => {
    // If we're using direct WhatsApp fallback, return empty array
    if (useDirectWhatsAppFallback) {
      return [];
    }

    try {
      const { data, error } = await supabaseClient
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) {
        // If table doesn't exist, set fallback flag
        if (error.code === '404' || error.message?.includes('does not exist')) {
          setUseDirectWhatsAppFallback(true);
          return [];
        }
        throw error;
      }
      
      const typedMessages: WhatsAppMessage[] = data?.map(item => ({
        id: item.id,
        conversation_id: item.conversation_id,
        content: item.content,
        type: item.type as MessageType | undefined,
        sender: item.sender,
        timestamp: item.timestamp,
        is_read: item.is_read,
        attachments: item.attachments,
        metadata: item.metadata
      })) || [];
      
      return typedMessages;
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      setError(t('errors.failedToFetchMessages'));
      return [];
    }
  };

  const sendMessage = async (
    conversationId: string, 
    content: string, 
    attachments: string[] = []
  ): Promise<boolean> => {
    if (!user) return false;

    // If we're using direct WhatsApp fallback, don't try to use Supabase
    if (useDirectWhatsAppFallback) {
      return false;
    }

    try {
      const conversation = getConversationById(conversationId);
      if (!conversation) return false;

      const isSeller = conversation.seller_id === user.id;
      
      const { error: msgError } = await supabaseClient
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          sender: isSeller ? 'seller' : 'buyer',
          content,
          attachments: attachments.length > 0 ? attachments : null,
          is_read: false,
        });

      if (msgError) {
        // If table doesn't exist, set fallback flag
        if (msgError.code === '404' || msgError.message?.includes('does not exist')) {
          setUseDirectWhatsAppFallback(true);
          return false;
        }
        throw msgError;
      }

      // Update conversation with last message
      const { error: convError } = await supabaseClient
        .from('whatsapp_conversations')
        .update({
          last_message: content,
          last_message_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (convError && !(convError.code === '404' || convError.message?.includes('does not exist'))) {
        throw convError;
      }

      // Update local state
      fetchConversations();
      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(t('errors.failedToSendMessage'));
      return false;
    }
  };

  const markAsRead = async (conversationId: string): Promise<void> => {
    if (!user || useDirectWhatsAppFallback) return;

    try {
      const conversation = getConversationById(conversationId);
      if (!conversation) return;

      const isSeller = conversation.seller_id === user.id;
      const otherParty = isSeller ? 'buyer' : 'seller';

      // Mark all messages from the other party as read
      const { error } = await supabaseClient
        .from('whatsapp_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender', otherParty)
        .eq('is_read', false);

      if (error && !(error.code === '404' || error.message?.includes('does not exist'))) {
        throw error;
      }

      // Update local state
      fetchConversations();
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      setError(t('errors.failedToMarkAsRead'));
    }
  };

  const updateTransactionStatus = async (update: TransactionUpdate): Promise<boolean> => {
    // If using fallback, don't try to use Supabase
    if (useDirectWhatsAppFallback) return false;
    
    try {
      const { conversationId, status, notes } = update;
      
      // Update conversation status
      const { error } = await supabaseClient
        .from('whatsapp_conversations')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        if (error.code === '404' || error.message?.includes('does not exist')) {
          setUseDirectWhatsAppFallback(true);
          return false;
        }
        throw error;
      }

      // Add system message about the status change
      if (notes) {
        const { error: msgError } = await supabaseClient
          .from('whatsapp_messages')
          .insert({
            conversation_id: conversationId,
            sender: 'system',
            content: notes,
            is_read: false,
          });
          
        if (msgError && !(msgError.code === '404' || msgError.message?.includes('does not exist'))) {
          throw msgError;
        }
      }

      // Update local state
      fetchConversations();
      return true;
    } catch (error: any) {
      console.error('Error updating transaction status:', error);
      setError(t('errors.failedToUpdateStatus'));
      return false;
    }
  };

  const getWhatsAppShareLink = (phoneNumber: string | undefined, message: string): string => {
    // Use default number if no phone number provided
    const numberToUse = phoneNumber ? phoneNumber : DEFAULT_WHATSAPP_NUMBER;
    // Format phone number (remove any non-digit characters)
    const formattedPhone = numberToUse.replace(/\D/g, '');
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };

  const contextValue: WhatsAppContextType = {
    conversations,
    loading,
    error,
    initiateConversation,
    getConversationById,
    getMessages,
    sendMessage,
    markAsRead,
    updateTransactionStatus,
    getWhatsAppShareLink,
  };

  return (
    <WhatsAppContext.Provider value={contextValue}>
      {children}
    </WhatsAppContext.Provider>
  );
}; 