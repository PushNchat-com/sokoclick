import { useEffect, useRef } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useLanguage } from '../store/LanguageContext';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

interface TimeoutMessages {
  warning: {
    en: string;
    fr: string;
  };
  expired: {
    en: string;
    fr: string;
  };
}

const messages: TimeoutMessages = {
  warning: {
    en: 'Your session will expire in 5 minutes. Would you like to stay signed in?',
    fr: 'Votre session expirera dans 5 minutes. Voulez-vous rester connecté ?'
  },
  expired: {
    en: 'Your session has expired. Please sign in again.',
    fr: 'Votre session a expiré. Veuillez vous reconnecter.'
  }
};

export const useSessionTimeout = () => {
  const { signOut } = useAdminAuth();
  const { t } = useLanguage();
  const timeoutId = useRef<NodeJS.Timeout>();
  const warningId = useRef<NodeJS.Timeout>();

  const resetTimeout = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    if (warningId.current) {
      clearTimeout(warningId.current);
    }

    // Set warning timeout
    warningId.current = setTimeout(() => {
      const stay = window.confirm(t(messages.warning));
      if (stay) {
        resetTimeout();
      }
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set session timeout
    timeoutId.current = setTimeout(async () => {
      alert(t(messages.expired));
      await signOut();
    }, SESSION_TIMEOUT);
  };

  useEffect(() => {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    // Set initial timeout
    resetTimeout();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      if (warningId.current) {
        clearTimeout(warningId.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [signOut, t]);
}; 