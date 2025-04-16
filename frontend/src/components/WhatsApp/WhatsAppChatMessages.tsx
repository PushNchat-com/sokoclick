import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { WhatsAppMessage, MessageSender } from '../../types/whatsapp';

interface WhatsAppChatMessagesProps {
  messages: WhatsAppMessage[];
}

const WhatsAppChatMessages: React.FC<WhatsAppChatMessagesProps> = ({ messages }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const determineMessageSide = (sender: MessageSender) => {
    // System messages are centered
    if (sender === MessageSender.SYSTEM) {
      return 'justify-center';
    }
    
    // User's messages are on the right
    if (
      (sender === MessageSender.USER && user?.id === messages[0]?.metadata?.userId) ||
      (sender === MessageSender.BUSINESS && user?.id === messages[0]?.metadata?.sellerId)
    ) {
      return 'justify-end';
    }
    
    // Other user's messages are on the left
    return 'justify-start';
  };

  const getMessageStyle = (sender: MessageSender) => {
    if (sender === MessageSender.SYSTEM) {
      return 'bg-gray-200 text-gray-800 rounded-lg px-4 py-2 max-w-[80%] text-sm text-center';
    }
    
    if (
      (sender === MessageSender.USER && user?.id === messages[0]?.metadata?.userId) ||
      (sender === MessageSender.BUSINESS && user?.id === messages[0]?.metadata?.sellerId)
    ) {
      return 'bg-primary-600 text-white rounded-lg px-4 py-2 max-w-[80%]';
    }
    
    return 'bg-white border border-gray-200 rounded-lg px-4 py-2 max-w-[80%]';
  };

  if (messages.length === 0) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        {t('whatsapp.noMessages')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${determineMessageSide(message.sender)}`}>
          <div>
            <div className={getMessageStyle(message.sender)}>
              {message.content}
            </div>
            <div className="text-xs text-gray-500 mt-1 px-2">
              {formatMessageTime(message.timestamp)}
              {message.isRead && (
                <span className="ml-1 text-primary-600">
                  ✓✓
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default WhatsAppChatMessages; 