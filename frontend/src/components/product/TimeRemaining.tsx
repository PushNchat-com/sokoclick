import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import StandardIcon from '../ui/StandardIcon';

interface TimeRemainingProps {
  expiryDate: Date;
  showLabel?: boolean;
  variant?: 'full' | 'compact';
  className?: string;
  showIcon?: boolean;
}

const TimeRemaining: React.FC<TimeRemainingProps> = ({
  expiryDate,
  showLabel = false,
  variant = 'full',
  className = '',
  showIcon = false,
}) => {
  const { language } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  }>({ days: 0, hours: 0, minutes: 0 });
  const [isExpired, setIsExpired] = useState(false);

  // Text translations
  const translations = {
    expired: {
      en: 'Expired',
      fr: 'Expiré'
    },
    timeLeft: {
      en: 'Time left',
      fr: 'Temps restant'
    },
    days: {
      en: 'Days',
      fr: 'Jours'
    },
    hours: {
      en: 'Hours',
      fr: 'Heures'
    },
    minutes: {
      en: 'Minutes',
      fr: 'Minutes'
    },
    dayShort: {
      en: 'd',
      fr: 'j'
    },
    hourShort: {
      en: 'h',
      fr: 'h'
    }
  };

  // Helper function to get translated text
  const t = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = expiryDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0 };
      }
      
      // Calculate time units
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      return { days, hours, minutes };
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());
    
    // Update every minute
    const timerId = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 60000);
    
    return () => clearInterval(timerId);
  }, [expiryDate]);

  if (isExpired) {
    return (
      <div className={`text-red-600 font-medium ${className}`}>
        {t('expired')}
      </div>
    );
  }

  // Different display formats based on variant
  if (variant === 'compact') {
    return (
      <div className={`text-sm flex items-center ${className}`}>
        {showIcon && <StandardIcon name="Clock" size="xs" className="mr-1 flex-shrink-0" />}
        {showLabel && <span className="text-gray-500 mr-1">{t('timeLeft')}:</span>}
        <span className="font-medium text-orange-600">
          {timeLeft.days > 0 ? `${timeLeft.days}${t('dayShort')} ` : ''}
          {timeLeft.hours}${t('hourShort')}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="text-gray-500 mb-1 flex items-center">
          {showIcon && <StandardIcon name="Clock" size="xs" className="mr-1 flex-shrink-0" />}
          {t('timeLeft')}
        </div>
      )}
      <div className="flex space-x-2">
        <div className="flex flex-col items-center">
          <div className="bg-gray-100 rounded-md px-2 py-1 min-w-[40px] text-center font-bold">
            {timeLeft.days}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('days')}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-gray-100 rounded-md px-2 py-1 min-w-[40px] text-center font-bold">
            {timeLeft.hours}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('hours')}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-gray-100 rounded-md px-2 py-1 min-w-[40px] text-center font-bold">
            {timeLeft.minutes}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('minutes')}</div>
        </div>
      </div>
    </div>
  );
};

export default TimeRemaining; 