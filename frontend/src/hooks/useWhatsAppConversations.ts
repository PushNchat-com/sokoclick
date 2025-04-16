import { useState, useEffect, useCallback } from 'react';
import { WhatsAppConversation, ConversationStatus, SendMessageParams, UpdateConversationStatusParams, MessageType } from '../types/whatsapp';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export const useWhatsAppConversations = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<WhatsAppConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { session } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const fetchConversations = useCallback(async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/whatsapp/conversations`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      setConversations(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [session, API_URL]);
  
  const fetchConversationDetails = useCallback(async (conversationId: string) => {
    if (!session) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/whatsapp/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      setActiveConversation(response.data);
      
      // Mark messages as read
      await markConversationAsRead(conversationId);
      
      // Update the conversation in the list
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load conversation details');
      console.error('Error fetching conversation details:', err);
    } finally {
      setLoading(false);
    }
  }, [session, API_URL]);
  
  const sendMessage = useCallback(async ({ conversationId, content, type = MessageType.TEXT, metadata }: SendMessageParams) => {
    if (!session) return;
    
    try {
      const response = await axios.post(
        `${API_URL}/whatsapp/conversations/${conversationId}/messages`, 
        { content, type, metadata },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      // Update the active conversation with the new message
      if (activeConversation && activeConversation.id === conversationId) {
        setActiveConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, response.data],
            lastMessage: content,
            lastMessageTime: new Date().toISOString()
          };
        });
      }
      
      // Update the conversation list
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { 
                ...conv, 
                lastMessage: content,
                lastMessageTime: new Date().toISOString()
              } 
            : conv
        )
      );
      
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
      console.error('Error sending message:', err);
      throw err;
    }
  }, [session, API_URL, activeConversation]);
  
  const updateConversationStatus = useCallback(async ({ conversationId, status }: UpdateConversationStatusParams) => {
    if (!session) return;
    
    try {
      await axios.patch(
        `${API_URL}/whatsapp/conversations/${conversationId}`, 
        { status },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      // Update the active conversation status
      if (activeConversation && activeConversation.id === conversationId) {
        setActiveConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status
          };
        });
      }
      
      // Update the conversation in the list
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, status } 
            : conv
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update conversation status');
      console.error('Error updating conversation status:', err);
      throw err;
    }
  }, [session, API_URL, activeConversation]);
  
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!session) return;
    
    try {
      await axios.post(
        `${API_URL}/whatsapp/conversations/${conversationId}/read`, 
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      // Update the conversation in the list
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
    } catch (err: any) {
      console.error('Error marking conversation as read:', err);
    }
  }, [session, API_URL]);
  
  // Initial load of conversations
  useEffect(() => {
    if (session) {
      fetchConversations();
    }
  }, [session, fetchConversations]);
  
  return {
    conversations,
    activeConversation,
    loading,
    error,
    fetchConversations,
    fetchConversationDetails,
    sendMessage,
    updateConversationStatus,
    markConversationAsRead,
    setActiveConversation
  };
}; 