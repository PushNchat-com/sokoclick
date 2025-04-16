import dayjs from './dayjs';

/**
 * Checks if a date is in the past
 */
export const isPast = (date: string | Date | number): boolean => {
  return dayjs(date).isBefore(dayjs());
};

/**
 * Checks if a date is in the future
 */
export const isFuture = (date: string | Date | number): boolean => {
  return dayjs(date).isAfter(dayjs());
};

/**
 * Checks if a date is today
 */
export const isToday = (date: string | Date | number): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * Get time remaining until a future date (in milliseconds)
 */
export const getTimeRemaining = (targetDate: string | Date | number): number => {
  const now = dayjs();
  const target = dayjs(targetDate);
  
  if (now.isAfter(target)) {
    return 0;
  }
  
  return target.diff(now);
};

/**
 * Format time remaining in a human-readable format
 */
export const formatTimeRemaining = (
  targetDate: string | Date | number,
  options: { showSeconds?: boolean; longFormat?: boolean } = {}
): string => {
  const { showSeconds = true, longFormat = false } = options;
  const now = dayjs();
  const target = dayjs(targetDate);
  
  if (now.isAfter(target)) {
    return '0:00';
  }
  
  const duration = dayjs.duration(target.diff(now));
  
  if (longFormat) {
    return duration.humanize();
  }
  
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  
  if (hours > 0) {
    return showSeconds 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return showSeconds
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}m`;
};

/**
 * Adds time to a date and returns a new date
 */
export const addTime = (
  date: string | Date | number,
  amount: number,
  unit: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
): Date => {
  return dayjs(date).add(amount, unit).toDate();
};

/**
 * Subtracts time from a date and returns a new date
 */
export const subtractTime = (
  date: string | Date | number,
  amount: number,
  unit: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
): Date => {
  return dayjs(date).subtract(amount, unit).toDate();
};

/**
 * Gets the start of a time period (day, week, month, etc.)
 */
export const startOf = (
  date: string | Date | number,
  unit: 'day' | 'week' | 'month' | 'year'
): Date => {
  return dayjs(date).startOf(unit).toDate();
};

/**
 * Gets the end of a time period (day, week, month, etc.)
 */
export const endOf = (
  date: string | Date | number,
  unit: 'day' | 'week' | 'month' | 'year'
): Date => {
  return dayjs(date).endOf(unit).toDate();
}; 