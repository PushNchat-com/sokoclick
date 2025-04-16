import { useState, useEffect, useCallback } from 'react';
import { formatTimeRemaining, getTimeRemaining } from '../../utils/timeUtils';

interface CountdownProps {
  targetDate: string | Date | number;
  onComplete?: () => void;
  className?: string;
  showSeconds?: boolean;
  longFormat?: boolean;
}

const Countdown = ({
  targetDate,
  onComplete,
  className = '',
  showSeconds = true,
  longFormat = false,
}: CountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>(
    formatTimeRemaining(targetDate, { showSeconds, longFormat })
  );
  const [isComplete, setIsComplete] = useState<boolean>(getTimeRemaining(targetDate) <= 0);

  const updateCountdown = useCallback(() => {
    const remaining = getTimeRemaining(targetDate);
    
    if (remaining <= 0) {
      setTimeRemaining('0:00');
      
      if (!isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
      
      return;
    }
    
    setTimeRemaining(formatTimeRemaining(targetDate, { showSeconds, longFormat }));
  }, [targetDate, isComplete, onComplete, showSeconds, longFormat]);

  useEffect(() => {
    // Initial update
    updateCountdown();
    
    // Don't start interval if already complete
    if (isComplete) return;
    
    // Update every second if showing seconds, otherwise every minute
    const interval = setInterval(
      updateCountdown,
      showSeconds ? 1000 : 60000
    );
    
    return () => clearInterval(interval);
  }, [updateCountdown, isComplete, showSeconds]);

  return (
    <div className={className}>
      {timeRemaining}
    </div>
  );
};

export default Countdown;
