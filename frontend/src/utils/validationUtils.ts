/**
 * Validation utility functions for SokoClick
 * Includes validators for WhatsApp numbers, form fields, and other validation needs
 */

// Regular expression for WhatsApp number validation (Cameroon format)
// Format: +237XXXXXXXXX where X is a digit
// Cameroon country code is 237, and phone numbers are 9 digits
const WHATSAPP_REGEX = /^\+237[2-9]\d{8}$/;

// Error messages in both English and French
export const ERROR_MESSAGES = {
  whatsappInvalid: {
    en: "Please enter a valid WhatsApp number in the format +237XXXXXXXXX",
    fr: "Veuillez entrer un numéro WhatsApp valide au format +237XXXXXXXXX",
  },
  whatsappMissingPlus: {
    en: "WhatsApp number must start with + symbol",
    fr: "Le numéro WhatsApp doit commencer par le symbole +",
  },
  whatsappWrongCountryCode: {
    en: "WhatsApp number must use Cameroon country code (+237)",
    fr: "Le numéro WhatsApp doit utiliser l'indicatif du Cameroun (+237)",
  },
  whatsappWrongLength: {
    en: "WhatsApp number must have 9 digits after the country code",
    fr: "Le numéro WhatsApp doit avoir 9 chiffres après l'indicatif du pays",
  },
  whatsappInvalidStart: {
    en: "WhatsApp number must start with 2-9 after country code",
    fr: "Le numéro WhatsApp doit commencer par 2-9 après l'indicatif du pays",
  },
  required: {
    en: "This field is required",
    fr: "Ce champ est obligatoire",
  },
};

/**
 * Validates a WhatsApp number according to Cameroon standards
 * @param number WhatsApp number to validate
 * @returns Object with isValid boolean and optional error message
 */
export const validateWhatsAppNumber = (
  number: string,
): { isValid: boolean; errorType?: keyof typeof ERROR_MESSAGES } => {
  // Check if number is empty
  if (!number || number.trim() === "") {
    return { isValid: false, errorType: "required" };
  }

  // Check if the number starts with +
  if (!number.startsWith("+")) {
    return { isValid: false, errorType: "whatsappMissingPlus" };
  }

  // Check if it has the Cameroon country code
  if (!number.startsWith("+237")) {
    return { isValid: false, errorType: "whatsappWrongCountryCode" };
  }

  // Check if the digit after country code is valid (2-9)
  if (!/^[2-9]/.test(number.substring(4, 5))) {
    return { isValid: false, errorType: "whatsappInvalidStart" };
  }

  // Check if it has the right length (9 digits after country code)
  if (number.length !== 13) {
    return { isValid: false, errorType: "whatsappWrongLength" };
  }

  // Full validation with regex
  if (!WHATSAPP_REGEX.test(number)) {
    return { isValid: false, errorType: "whatsappInvalid" };
  }

  return { isValid: true };
};

/**
 * Formats a phone number to WhatsApp standard format
 * @param number Phone number to format
 * @returns Formatted WhatsApp number
 */
export const formatWhatsAppNumber = (number: string): string => {
  // Remove all non-digit characters except the plus
  let cleaned = number.replace(/[^\d+]/g, "");

  // Ensure it starts with +
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  // If the number doesn't have a country code but has 9 digits,
  // assume it's a Cameroon number and add the country code
  if (cleaned.startsWith("+") && cleaned.length === 10) {
    cleaned = "+237" + cleaned.substring(1);
  }

  return cleaned;
};

/**
 * Checks if a phone number is a valid WhatsApp number and formats it
 * @param number Phone number to validate and format
 * @returns Object with formatted number and validation result
 */
export const validateAndFormatWhatsApp = (
  number: string,
): {
  formattedNumber: string;
  isValid: boolean;
  errorType?: keyof typeof ERROR_MESSAGES;
} => {
  const formattedNumber = formatWhatsAppNumber(number);
  const validation = validateWhatsAppNumber(formattedNumber);

  return {
    formattedNumber,
    isValid: validation.isValid,
    errorType: validation.errorType,
  };
};

/**
 * Gets a localized error message for validation errors
 * @param errorType Type of validation error
 * @param language Current language ('en' or 'fr')
 * @returns Localized error message
 */
export const getValidationErrorMessage = (
  errorType: keyof typeof ERROR_MESSAGES | undefined,
  language: "en" | "fr" = "en",
): string => {
  if (!errorType) return "";

  return ERROR_MESSAGES[errorType][language];
};

/**
 * Generates a WhatsApp link with properly formatted number and message
 * @param number WhatsApp number
 * @param message Message to send (will be URI encoded)
 * @returns WhatsApp link URL
 */
export const generateWhatsAppLink = (
  number: string,
  message: string,
): string => {
  const { formattedNumber, isValid } = validateAndFormatWhatsApp(number);

  if (!isValid) {
    console.warn("Invalid WhatsApp number used for link generation:", number);
  }

  // Remove the + symbol for the wa.me link format
  const waNumber = formattedNumber.replace("+", "");
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${waNumber}?text=${encodedMessage}`;
};
