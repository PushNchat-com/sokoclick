import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Import locale support as needed
import 'dayjs/locale/en';
import 'dayjs/locale/pl';
// Add more languages as needed

// Extend dayjs with plugins
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);

// Set default locale - this will be overridden by i18n system
dayjs.locale('en');

// Helper functions
export const formatDate = (date: string | Date | number | dayjs.Dayjs, format = 'LL') => {
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string | Date | number | dayjs.Dayjs) => {
  return dayjs(date).fromNow();
};

export const formatDateWithTime = (date: string | Date | number | dayjs.Dayjs) => {
  return dayjs(date).format('LLL');
};

export const formatTimeOnly = (date: string | Date | number | dayjs.Dayjs) => {
  return dayjs(date).format('LT');
};

export const formatDuration = (milliseconds: number) => {
  return dayjs.duration(milliseconds).humanize();
};

export const setLocale = (locale: string) => {
  dayjs.locale(locale);
};

// Export the dayjs instance for direct use
export default dayjs; 