import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ConversationStatus, WhatsAppConversation } from '../../types/whatsapp';

interface WhatsAppConversationListProps {
  conversations: WhatsAppConversation[];
  loading: boolean;
  onSelectConversation: (conversation: WhatsAppConversation) => void;
  selectedConversationId?: string;
}

const WhatsAppConversationList: React.FC<WhatsAppConversationListProps> = ({
  conversations,
  loading,
  onSelectConversation,
  selectedConversationId,
}) => {
  const { t } = useTranslation();

  const getStatusBadge = (status: ConversationStatus) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const color = statusColors[status] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {t(`whatsapp.status.${status}`)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // Same day - show time only
    if (date.toDateString() === today.toDateString()) {
      return format(date, 'HH:mm');
    }
    
    // This year - show day and month
    if (date.getFullYear() === today.getFullYear()) {
      return format(date, 'd MMM');
    }
    
    // Different year - show day, month and year
    return format(date, 'd MMM yyyy');
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">{t('whatsapp.noConversations')}</div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 overflow-y-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`p-4 cursor-pointer transition hover:bg-gray-50 ${
            selectedConversationId === conversation.id ? 'bg-primary-50' : ''
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="flex items-start">
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
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {conversation.productName || t('whatsapp.untitledProduct')}
                </h3>
                <span className="text-xs text-gray-500">
                  {formatDate(conversation.lastMessageTime)}
                </span>
              </div>
              
              <div className="mt-1 flex items-center">
                <p className="text-sm text-gray-500 truncate">
                  {conversation.lastMessage}
                </p>
              </div>
              
              <div className="mt-1 flex items-center justify-between">
                {getStatusBadge(conversation.status)}
                
                {conversation.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-600 text-xs font-medium text-white">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WhatsAppConversationList; 