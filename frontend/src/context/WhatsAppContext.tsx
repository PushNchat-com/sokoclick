import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from './AuthContext';
import { WhatsAppConversation, ConversationStatus, TransactionUpdate, WhatsAppMessage } from '../types/whatsapp';

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
  getWhatsAppShareLink: (phoneNumber: string, message: string) => string;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (context === undefined) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};

export const WhatsAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const supabase = useSupabaseClient();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Find conversations where the user is either buyer or seller
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .or(`buyerId.eq.${user.id},sellerId.eq.${user.id}`)
        .order('updatedAt', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error('Error fetching WhatsApp conversations:', error);
      setError(t('errors.failedToFetchConversations'));
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

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('productId', productId)
        .eq('buyerId', user.id)
        .eq('sellerId', sellerId)
        .single();

      if (existingConv) return existingConv.id;

      // Create new conversation
      const threadId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .insert({
          productId,
          buyerId: user.id,
          sellerId,
          threadId,
          productName,
          productImage,
          status: ConversationStatus.INITIATED,
        })
        .select()
        .single();

      if (error) throw error;
      
      setConversations([data, ...conversations]);
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
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversationId', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
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

    try {
      const conversation = getConversationById(conversationId);
      if (!conversation) return false;

      const isSeller = conversation.sellerId === user.id;
      
      const { error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversationId,
          sender: isSeller ? 'seller' : 'buyer',
          content,
          attachments: attachments.length > 0 ? attachments : null,
          isRead: false,
        });

      if (msgError) throw msgError;

      // Update conversation with last message
      const { error: convError } = await supabase
        .from('whatsapp_conversations')
        .update({
          lastMessage: content,
          lastMessageTimestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (convError) throw convError;

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
    if (!user) return;

    try {
      const conversation = getConversationById(conversationId);
      if (!conversation) return;

      const isSeller = conversation.sellerId === user.id;
      const otherParty = isSeller ? 'buyer' : 'seller';

      // Mark all messages from the other party as read
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ isRead: true })
        .eq('conversationId', conversationId)
        .eq('sender', otherParty)
        .eq('isRead', false);

      if (error) throw error;

      // Update local state
      fetchConversations();
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      setError(t('errors.failedToMarkAsRead'));
    }
  };

  const updateTransactionStatus = async (update: TransactionUpdate): Promise<boolean> => {
    try {
      const { conversationId, status, notes } = update;
      
      // Update conversation status
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({
          status,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) throw error;

      // Add system message about the status change
      if (notes) {
        await supabase
          .from('whatsapp_messages')
          .insert({
            conversationId,
            sender: 'system',
            content: notes,
            isRead: false,
          });
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

  const getWhatsAppShareLink = (phoneNumber: string, message: string): string => {
    // Format phone number (remove any non-digit characters)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
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