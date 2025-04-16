/**
 * Format a number as currency with the provided currency code
 * @param amount The amount to format
 * @param currencyCode The currency code (e.g., USD, EUR, KES)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  // Handle edge cases
  if (isNaN(amount)) return '0.00';
  
  try {
    // Get the currency display format based on currency code
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${amount.toLocaleString()} ${currencyCode}`;
  }
};

/**
 * Format a number as a percentage
 * @param value The value to format as a percentage
 * @param decimalPlaces Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimalPlaces: number = 1): string => {
  if (isNaN(value)) return '0%';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  
  return formatter.format(value / 100);
};

/**
 * Format a number with a thousands separator
 * @param value The number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  if (isNaN(value)) return '0';
  
  return value.toLocaleString('en-US');
};

/**
 * Format file size in bytes to a human-readable format
 * @param bytes Size in bytes
 * @returns Formatted size string (e.g., "1.5 KB", "3.2 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}; 