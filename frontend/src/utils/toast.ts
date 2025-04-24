import { Toaster as HotToaster, toast as hotToast } from 'react-hot-toast';
import { TranslationObject } from '../store/LanguageContext';
import React from 'react';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Custom toast options
 */
export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Toast service for displaying notifications with bilingual support
 */
export const toast = {
  /**
   * Display a success toast message
   * @param message The message or translation object
   * @param options Toast display options
   */
  success(message: string | TranslationObject, options?: ToastOptions) {
    const msg = typeof message === 'string' ? message : getCurrentLanguageText(message);
    return hotToast.success(msg, getToastOptions('success', options));
  },

  /**
   * Display an error toast message
   * @param message The message or translation object
   * @param options Toast display options
   */
  error(message: string | TranslationObject, options?: ToastOptions) {
    const msg = typeof message === 'string' ? message : getCurrentLanguageText(message);
    return hotToast.error(msg, getToastOptions('error', options));
  },

  /**
   * Display an info toast message
   * @param message The message or translation object
   * @param options Toast display options
   */
  info(message: string | TranslationObject, options?: ToastOptions) {
    const msg = typeof message === 'string' ? message : getCurrentLanguageText(message);
    
    // Use a simpler approach without custom JSX to avoid potential issues
    return hotToast(msg, {
      icon: 'ℹ️',
      style: {
        backgroundColor: '#EBF5FF',
        color: '#2563EB',
        border: '1px solid #93C5FD',
      },
      ...getToastOptions('info', options)
    });
  },

  /**
   * Display a warning toast message
   * @param message The message or translation object
   * @param options Toast display options
   */
  warning(message: string | TranslationObject, options?: ToastOptions) {
    const msg = typeof message === 'string' ? message : getCurrentLanguageText(message);
    
    // Use a simpler approach without custom JSX to avoid potential issues
    return hotToast(msg, {
      icon: '⚠️',
      style: {
        backgroundColor: '#FFFBEB',
        color: '#D97706',
        border: '1px solid #FCD34D',
      },
      ...getToastOptions('warning', options)
    });
  },

  /**
   * Display a custom toast message
   * @param message The message or translation object
   * @param type Toast type
   * @param options Toast display options
   */
  custom(message: string | TranslationObject, type: ToastType = 'info', options?: ToastOptions) {
    switch(type) {
      case 'success':
        return this.success(message, options);
      case 'error':
        return this.error(message, options);
      case 'warning':
        return this.warning(message, options);
      case 'info':
      default:
        return this.info(message, options);
    }
  },

  /**
   * Dismiss all toast notifications
   */
  dismiss() {
    hotToast.dismiss();
  },

  /**
   * Dismiss a specific toast notification
   * @param id The toast id
   */
  dismissById(id: string) {
    hotToast.dismiss(id);
  }
};

/**
 * React component for rendering the toast container
 */
export const Toaster = HotToaster;

/**
 * Get toast options with defaults
 * @param type The toast type
 * @param options User-provided options
 * @returns Combined toast options
 */
function getToastOptions(type: ToastType, options?: ToastOptions) {
  const defaultOptions = {
    duration: type === 'error' ? 5000 : 3000,
    position: 'top-right' as const,
  };

  return { ...defaultOptions, ...options };
}

/**
 * Get text in the current language from a translation object
 * @param obj Translation object
 * @returns Text in current language or English fallback
 */
function getCurrentLanguageText(obj: TranslationObject): string {
  // Get current language from localStorage or default to English
  const currentLang = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('language') as 'en' | 'fr' || 'en'
    : 'en';
  
  return obj[currentLang] || obj.en || '';
}

export default toast; 