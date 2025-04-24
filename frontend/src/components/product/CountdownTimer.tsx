import React, { useState, useEffect } from 'react';
import { ClockIcon } from '../ui/Icons';

interface CountdownTimerProps {
  endTime: Date;
  onComplete?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endTime,
  onComplete,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsCompleted(true);
        if (onComplete) onComplete();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.days === 0 && 
          newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && 
          newTimeLeft.seconds === 0) {
        clearInterval(timer);
      }
    }, 1000);

    // Clear interval on unmount
    return () => clearInterval(timer);
  }, [endTime, onComplete]);

  // Format the time unit with leading zeros
  const formatTimeUnit = (value: number): string => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  if (isCompleted) {
    return <div className={className}>Ended</div>;
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {timeLeft.days > 0 && (
        <div className="flex items-center">
          <span className="font-semibold">{timeLeft.days}</span>
          <span className="text-xs ml-1">d</span>
        </div>
      )}
      <div className="flex items-center">
        <span className="font-semibold">{formatTimeUnit(timeLeft.hours)}</span>
        <span className="text-xs ml-1">h</span>
      </div>
      <div className="flex items-center">
        <span className="font-semibold">{formatTimeUnit(timeLeft.minutes)}</span>
        <span className="text-xs ml-1">m</span>
      </div>
      <div className="flex items-center">
        <span className="font-semibold">{formatTimeUnit(timeLeft.seconds)}</span>
        <span className="text-xs ml-1">s</span>
      </div>
    </div>
  );
};

export default CountdownTimer; 