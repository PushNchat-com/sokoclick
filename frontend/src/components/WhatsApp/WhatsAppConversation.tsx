import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Text, VStack, HStack, Input, Button, Avatar, Spinner, Flex, IconButton, Badge } from '@chakra-ui/react';
import { AttachmentIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { WhatsAppMessage, ConversationStatus, MessageSender } from '../../types/whatsapp';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

interface WhatsAppConversationProps {
  conversationId: string;
}

const WhatsAppConversation: React.FC<WhatsAppConversationProps> = ({ conversationId }) => {
  const { t } = useTranslation();
  const { getConversationById, getMessages, sendMessage, markAsRead } = useWhatsApp();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const conversation = getConversationById(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (conversationId) {
      loadMessages();
      
      // Mark messages as read when conversation is opened
      markAsRead(conversationId);
      
      // Poll for new messages every 10 seconds
      const intervalId = setInterval(loadMessages, 10000);
      return () => clearInterval(intervalId);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const fetchedMessages = await getMessages(conversationId);
    setMessages(fetchedMessages);
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    
    const success = await sendMessage(conversationId, inputMessage.trim());
    if (success) {
      setInputMessage('');
      await loadMessages();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusBadge = (status: ConversationStatus) => {
    let color = 'gray';
    
    switch (status) {
      case ConversationStatus.ACTIVE:
        color = 'blue';
        break;
      case ConversationStatus.PENDING:
        color = 'orange';
        break;
      case ConversationStatus.COMPLETED:
        color = 'green';
        break;
      case ConversationStatus.CANCELLED:
        color = 'red';
        break;
      default:
        color = 'gray';
    }
    
    return (
      <Badge colorScheme={color} fontSize="xs" px={2}>
        {t(`whatsapp.status.${status.toLowerCase()}`)}
      </Badge>
    );
  };

  if (!conversation) {
    return (
      <Box p={4} textAlign="center">
        <Text>{t('whatsapp.conversationNotFound')}</Text>
      </Box>
    );
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" h="full" display="flex" flexDirection="column">
      {/* Conversation Header */}
      <Box p={4} borderBottomWidth="1px" bg="gray.50">
        <Flex justifyContent="space-between" alignItems="center">
          <HStack>
            {conversation.productImage ? (
              <Avatar size="sm" src={conversation.productImage} name={conversation.productName} />
            ) : (
              <Avatar size="sm" name={conversation.productName} />
            )}
            <Box>
              <Text fontWeight="bold">{conversation.productName}</Text>
              <Text fontSize="xs" color="gray.500">
                {conversation.sellerId === user?.id 
                  ? t('whatsapp.buyerContact') 
                  : t('whatsapp.sellerContact')}
              </Text>
            </Box>
          </HStack>
          {getStatusBadge(conversation.status)}
        </Flex>
      </Box>

      {/* Messages Container */}
      <VStack flex="1" p={4} overflowY="auto" spacing={3} align="stretch">
        {loading ? (
          <Flex justify="center" align="center" h="full">
            <Spinner />
          </Flex>
        ) : messages.length === 0 ? (
          <Flex justify="center" align="center" h="full">
            <Text color="gray.500">{t('whatsapp.noMessages')}</Text>
          </Flex>
        ) : (
          messages.map((message) => (
            <Box 
              key={message.id} 
              alignSelf={message.sender === MessageSender.SYSTEM 
                ? 'center' 
                : message.sender === MessageSender.BUSINESS 
                ? 'flex-end' 
                : 'flex-start'}
              maxWidth="70%"
              bg={message.sender === MessageSender.SYSTEM 
                ? 'gray.100' 
                : message.sender === MessageSender.BUSINESS
                ? 'green.100' 
                : 'blue.100'}
              p={3}
              borderRadius="lg"
            >
              <Text>{message.content}</Text>
              <Text fontSize="xs" color="gray.500" textAlign="right">
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </Text>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </VStack>

      {/* Message Input */}
      <HStack p={4} borderTopWidth="1px">
        <IconButton
          aria-label="Attach file"
          icon={<AttachmentIcon />}
          variant="ghost"
          isDisabled={conversation.status === ConversationStatus.COMPLETED || 
                      conversation.status === ConversationStatus.CANCELLED}
        />
        <Input
          placeholder={t('whatsapp.typeMessage')}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          isDisabled={conversation.status === ConversationStatus.COMPLETED || 
                      conversation.status === ConversationStatus.CANCELLED}
        />
        <Button
          colorScheme="green"
          rightIcon={<ArrowForwardIcon />}
          onClick={handleSend}
          isDisabled={!inputMessage.trim() || 
                     conversation.status === ConversationStatus.COMPLETED || 
                     conversation.status === ConversationStatus.CANCELLED}
        >
          {t('whatsapp.send')}
        </Button>
      </HStack>
    </Box>
  );
};

export default WhatsAppConversation; 