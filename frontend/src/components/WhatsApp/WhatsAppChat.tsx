import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WhatsAppConversation, WhatsAppMessage } from '../../types/whatsapp';
import { useWhatsApp } from '../../context/WhatsAppContext';
import WhatsAppChatMessages from './WhatsAppChatMessages';
import WhatsAppChatInput from './WhatsAppChatInput';
import Button from '../ui/Button';

interface WhatsAppChatProps {
  conversation: WhatsAppConversation;
  onBack?: () => void;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({ conversation, onBack }) => {
  const { t } = useTranslation();
  const { getMessages, sendMessage, markAsRead } = useWhatsApp();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markAsRead(conversation.id);
    }
  }, [conversation?.id]);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedMessages = await getMessages(conversation.id);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(t('errors.failedToLoadMessages'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string, attachments: string[] = []) => {
    if (!content.trim() && attachments.length === 0) return;
    
    const success = await sendMessage(conversation.id, content, attachments);
    if (success) {
      fetchMessages();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b p-4 flex items-center">
        <button 
          onClick={onBack}
          className="md:hidden mr-2 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center flex-1">
          <div className="flex-shrink-0 mr-3">
            {conversation.productImage ? (
              <img
                src={conversation.productImage}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 uppercase">
                  {conversation.productName?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {conversation.productName || t('whatsapp.untitledProduct')}
            </h3>
            <p className="text-xs text-gray-500">
              {t(`whatsapp.status.${conversation.status}`)}
            </p>
          </div>
        </div>
        
        <div>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/sc/${conversation.productId}`, '_blank')}
          >
            {t('product.viewDetails')}
          </Button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            {error}
            <button 
              onClick={fetchMessages}
              className="block mx-auto mt-2 text-primary-600 hover:underline"
            >
              {t('retry')}
            </button>
          </div>
        ) : (
          <WhatsAppChatMessages messages={messages} />
        )}
      </div>
      
      {/* Chat Input */}
      <div className="border-t bg-white p-4">
        <WhatsAppChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default WhatsAppChat; 