import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

interface WhatsAppChatInputProps {
  onSendMessage: (content: string, attachments?: string[]) => Promise<void>;
  isLoading?: boolean;
}

const WhatsAppChatInput: React.FC<WhatsAppChatInputProps> = ({ onSendMessage, isLoading = false }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading || isUploading || (!message.trim() && attachments.length === 0)) {
      return;
    }
    
    await onSendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // In a real app, we would upload the file to a server here
    // and then add the URL to the attachments array
    
    // Mock file upload
    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      const newAttachments = Array.from(e.target.files || []).map(file => {
        // In a real app, this would be a URL to the uploaded file
        return URL.createObjectURL(file);
      });
      
      setAttachments([...attachments, ...newAttachments]);
      setIsUploading(false);
      e.target.value = '';
    }, 1000);
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              <img 
                src={attachment} 
                alt="" 
                className="h-16 w-16 object-cover rounded-md border border-gray-200" 
              />
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end">
        {/* File input */}
        <div className="relative mr-2">
          <input
            type="file"
            id="file-upload"
            accept="image/*"
            multiple
            onChange={handleAttachmentUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading || isUploading}
          />
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full"
            disabled={isLoading || isUploading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>
        
        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('whatsapp.typeMessage')}
            className="w-full border border-gray-300 rounded-lg py-2 px-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            disabled={isLoading || isUploading}
          />
        </div>
        
        {/* Send button */}
        <Button
          type="submit"
          variant="primary"
          className="ml-2 h-10 w-10 flex-shrink-0 rounded-full p-0 flex items-center justify-center"
          disabled={isLoading || isUploading || (!message.trim() && attachments.length === 0)}
        >
          {isLoading || isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </Button>
      </div>
    </form>
  );
};

export default WhatsAppChatInput; 