import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import WhatsAppConversationList from '../components/WhatsApp/WhatsAppConversationList';
import { useWhatsApp } from '../context/WhatsAppContext';
import { WhatsAppConversation } from '../types/whatsapp';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { useToast } from '../providers/ToastProvider';

const WhatsAppDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { conversations, loading, error } = useWhatsApp();
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const toast = useToast();

  // Show error toast if there's an error loading conversations
  useEffect(() => {
    if (error) {
      toast.showToast(error, 'error');
    }
  }, [error, toast]);

  const handleSelectConversation = (conversation: WhatsAppConversation) => {
    setSelectedConversation(conversation);
  };

  // Filter conversations based on active tab
  const filteredConversations = conversations.filter((conversation) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return conversation.status === 'active' || conversation.status === 'pending';
    if (activeTab === 'completed') return conversation.status === 'completed' || conversation.status === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('whatsapp.conversations')}</h1>
            <p className="text-sm text-gray-500">{t('whatsapp.conversationsDescription')}</p>
          </div>
          
          {!user ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-700 mb-4">{t('whatsapp.loginToViewConversations')}</p>
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/login'}
              >
                {t('signIn')}
              </Button>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'all'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('all')}
                  >
                    {t('whatsapp.allConversations')}
                  </button>
                  
                  <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'active'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('active')}
                  >
                    {t('whatsapp.activeConversations')}
                  </button>
                  
                  <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'completed'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('completed')}
                  >
                    {t('whatsapp.completedConversations')}
                  </button>
                </nav>
              </div>
              
              <div className="md:grid md:grid-cols-3 md:divide-x">
                <div className="md:col-span-1 border-b md:border-b-0">
                  <WhatsAppConversationList
                    conversations={filteredConversations}
                    loading={loading}
                    onSelectConversation={handleSelectConversation}
                    selectedConversationId={selectedConversation?.id}
                  />
                </div>
                
                <div className="md:col-span-2 h-[600px] flex items-center justify-center p-6 bg-gray-50">
                  {selectedConversation ? (
                    <div className="text-center">
                      <p className="text-gray-500">{t('whatsapp.conversationSelected')}</p>
                      <p className="font-medium">{selectedConversation.productName}</p>
                      <p className="text-sm text-gray-500 mt-2">{t('whatsapp.conversationIntegrationComing')}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg 
                        className="w-16 h-16 text-gray-300 mx-auto mb-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                        />
                      </svg>
                      <p className="text-gray-500">{t('whatsapp.selectConversation')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default WhatsAppDashboard; 