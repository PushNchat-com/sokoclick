/**
 * Common form validation rules
 */

export type ValidationRule = (value: string) => string | undefined;

export const required = (fieldName = 'Field'): ValidationRule => {
  return (value: string) => {
    return !value.trim() ? `${fieldName} is required` : undefined;
  };
};

export const minLength = (min: number, fieldName = 'Field'): ValidationRule => {
  return (value: string) => {
    return value.length < min ? `${fieldName} must be at least ${min} characters` : undefined;
  };
};

export const maxLength = (max: number, fieldName = 'Field'): ValidationRule => {
  return (value: string) => {
    return value.length > max ? `${fieldName} must be less than ${max} characters` : undefined;
  };
};

export const email: ValidationRule = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !emailRegex.test(value) ? 'Please enter a valid email address' : undefined;
};

export const password: ValidationRule = (value: string) => {
  if (value.length < 6) {
    return 'Password must be at least 6 characters';
  }
  
  return undefined;
};

export const phoneNumber: ValidationRule = (value: string) => {
  // Basic phone number validation - can be adjusted based on country requirements
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return !phoneRegex.test(value.replace(/[\s-]/g, '')) 
    ? 'Please enter a valid phone number' 
    : undefined;
};

export const matchesField = (fieldName: string, matchValue: string): ValidationRule => {
  return (value: string) => {
    return value !== matchValue ? `Does not match ${fieldName}` : undefined;
  };
};

export const url: ValidationRule = (value: string) => {
  try {
    new URL(value);
    return undefined;
  } catch {
    return 'Please enter a valid URL';
  }
};

/**
 * Validate a field with multiple rules
 * Returns the first error message encountered, or undefined if valid
 */
export const validateField = (value: string, rules: ValidationRule[]): string | undefined => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) {
      return error;
    }
  }
  return undefined;
};

/**
 * Validate a form with multiple fields
 * Returns an object with field names as keys and error messages as values
 */
export const validateForm = (
  fields: Record<string, string>,
  fieldRules: Record<string, ValidationRule[]>
): Record<string, string | undefined> => {
  const errors: Record<string, string | undefined> = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const rules = fieldRules[fieldName];
    if (rules) {
      errors[fieldName] = validateField(value, rules);
    }
  }
  
  return errors;
};

/**
 * Check if a form has any validation errors
 */
export const hasErrors = (errors: Record<string, string | undefined>): boolean => {
  return Object.values(errors).some(error => !!error);
}; 