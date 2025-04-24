import { PasswordValidationResult } from '../types/auth';

/**
 * Validates password strength and returns detailed feedback
 */
export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  
  const requirements = [
    { met: password.length >= minLength, message: { en: 'At least 8 characters', fr: 'Au moins 8 caractères' } },
    { met: hasUpperCase, message: { en: 'At least one uppercase letter', fr: 'Au moins une lettre majuscule' } },
    { met: hasLowerCase, message: { en: 'At least one lowercase letter', fr: 'Au moins une lettre minuscule' } },
    { met: hasNumbers, message: { en: 'At least one number', fr: 'Au moins un chiffre' } },
    { met: hasSpecialChar, message: { en: 'At least one special character (!@#$%^&*)', fr: 'Au moins un caractère spécial (!@#$%^&*)' } }
  ];
  
  const unmetRequirements = requirements.filter(req => !req.met);
  
  return {
    isValid: unmetRequirements.length === 0,
    unmetRequirements: unmetRequirements.map(req => req.message)
  };
};

/**
 * Validates and formats Cameroon phone numbers
 */
export const validateAndFormatPhone = (phone: string): { isValid: boolean; formatted: string } => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if it's a valid Cameroon number
  const isCameroonFormat = /^(?:237|)?([2368]\d{8})$/.test(digits);
  
  if (!isCameroonFormat) {
    return { isValid: false, formatted: phone };
  }
  
  // Format as international number
  const formatted = digits.replace(/^(?:237)?(\d{9})$/, '+237$1');
  
  return { isValid: true, formatted };
};

/**
 * Sanitizes user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Generates a CSRF token
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validates reset password token
 */
export const validateResetToken = (token: string): boolean => {
  // Check if token exists and has correct format
  if (!token || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    return false;
  }
  
  // Add additional validation as needed
  return true;
};

/**
 * Tracks security events
 */
export const trackSecurityEvent = async (
  eventType: 'login' | 'logout' | 'password_reset' | 'signup' | 'password_change',
  metadata: Record<string, any>
) => {
  try {
    const response = await fetch('/api/security/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        timestamp: new Date().toISOString(),
        ...metadata
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to log security event');
    }
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }>;
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.attempts = new Map();
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(key: string): { limited: boolean; waitMs: number } {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return { limited: false, waitMs: 0 };
    }

    if (now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return { limited: false, waitMs: 0 };
    }

    if (attempt.count >= this.maxAttempts) {
      return { limited: true, waitMs: attempt.resetTime - now };
    }

    attempt.count++;
    return { limited: false, waitMs: 0 };
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
} 