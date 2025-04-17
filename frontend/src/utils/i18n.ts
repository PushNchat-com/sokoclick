// This file is deprecated - using main i18n config from src/i18n/index.ts instead
import i18n from '../i18n';
import dayjs from 'dayjs';

// Synchronize dayjs locale when i18n language changes
i18n.on('languageChanged', (lng) => {
  dayjs.locale(lng);
});

export default i18n; 