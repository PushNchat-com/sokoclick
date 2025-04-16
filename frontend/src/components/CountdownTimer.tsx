import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CountdownTimerProps {
  endTime: string;
  onComplete?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, onComplete, className = '' }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsComplete(true);
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onComplete]);

  if (isComplete) {
    return <div className={`text-red-600 font-medium ${className}`}>{t('auctionEnded')}</div>;
  }

  return (
    <div className={`grid grid-cols-4 gap-2 text-center ${className}`}>
      <div className="bg-gray-100 rounded p-1">
        <div className="text-xl font-bold">{timeLeft.days}</div>
        <div className="text-xs text-gray-500">{t('days')}</div>
      </div>
      <div className="bg-gray-100 rounded p-1">
        <div className="text-xl font-bold">{timeLeft.hours}</div>
        <div className="text-xs text-gray-500">{t('hours')}</div>
      </div>
      <div className="bg-gray-100 rounded p-1">
        <div className="text-xl font-bold">{timeLeft.minutes}</div>
        <div className="text-xs text-gray-500">{t('minutes')}</div>
      </div>
      <div className="bg-gray-100 rounded p-1">
        <div className="text-xl font-bold">{timeLeft.seconds}</div>
        <div className="text-xs text-gray-500">{t('seconds')}</div>
      </div>
    </div>
  );
};

export default CountdownTimer; 