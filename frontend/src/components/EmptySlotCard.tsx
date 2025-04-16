import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Card, { CardBody, CardFooter } from './ui/Card';
import { H3, Text } from './ui/Typography';
import Button from './ui/Button';

interface EmptySlotCardProps {
  slotId?: number;
  className?: string;
}

/**
 * EmptySlotCard component for displaying empty auction slots
 * using the SokoClick design system
 */
const EmptySlotCard: React.FC<EmptySlotCardProps> = ({ slotId, className = '' }) => {
  const { t } = useTranslation();
  
  return (
    <Card variant="hover" className={`h-full transition-all duration-300 ${className}`}>
      <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-t-lg overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <svg 
            className="w-12 h-12 text-gray-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      </div>
      
      <CardBody>
        <H3>{t('emptySlot')}</H3>
        <Text variant="body-sm" className="text-gray-600 mt-2">
          {t('emptySlotMessage', 'This auction slot is currently empty. Check back later for new products.')}
        </Text>
      </CardBody>
      
      <CardFooter>
        <Link to="/" className="w-full">
          <Button variant="ghost" fullWidth>
            {t('backToAuctions')}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default EmptySlotCard; 