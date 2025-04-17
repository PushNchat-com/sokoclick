/**
 * Format a number as currency with the provided currency code
 * @param amount The amount to format
 * @param currencyCode The currency code (e.g., USD, EUR, KES)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string,
  currencyCode: string = 'XAF'
): string => {
  if (amount === null || amount === undefined) return '';

  // Convert string to number if needed
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // If conversion results in NaN, return empty string
  if (isNaN(numAmount)) return '';

  try {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  } catch (error) {
    // Fallback for unsupported currency codes
    return `${currencyCode} ${numAmount.toLocaleString('fr-CM')}`;
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