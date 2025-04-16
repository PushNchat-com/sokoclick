import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from '../../utils/dayjs';
import { formatDate, formatRelativeTime, formatDateWithTime } from '../../utils/dayjs';

type DateFormat = 'relative' | 'date' | 'datetime' | 'custom';

interface DateDisplayProps {
  date: string | Date | number;
  format?: DateFormat;
  customFormat?: string;
  className?: string;
  showTooltip?: boolean;
}

const DateDisplay = ({
  date,
  format = 'date',
  customFormat,
  className = '',
  showTooltip = true,
}: DateDisplayProps) => {
  const { t } = useTranslation();
  
  const formattedDate = useMemo(() => {
    switch (format) {
      case 'relative':
        return formatRelativeTime(date);
      case 'datetime':
        return formatDateWithTime(date);
      case 'custom':
        return customFormat ? dayjs(date).format(customFormat) : formatDate(date);
      case 'date':
      default:
        return formatDate(date);
    }
  }, [date, format, customFormat]);
  
  const fullDate = useMemo(() => {
    return dayjs(date).format('LLLL');
  }, [date]);
  
  if (!date) {
    return <span className={className}>{t('notAvailable')}</span>;
  }
  
  return (
    <span className={className} title={showTooltip ? fullDate : undefined}>
      {formattedDate}
    </span>
  );
};

export default DateDisplay; 