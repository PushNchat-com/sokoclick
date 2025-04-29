export const formatPrice = (price: number, currency: string): string => {
  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency === "XAF" ? "XAF" : "XAF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(price);
};

/**
 * Format a date and time for display
 * @param date The date to format
 * @param locale Optional locale (defaults to 'fr-FR')
 * @returns Formatted date string
 */
export const formatDateTime = (
  date: Date,
  locale: string = "fr-FR",
): string => {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
