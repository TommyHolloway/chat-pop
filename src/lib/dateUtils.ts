/**
 * UTC-safe date conversion utilities for consistent timezone handling
 * Converts local dates to UTC boundaries for database queries
 */

/**
 * Convert a date to UTC midnight (start of day)
 * @param date - Local date to convert
 * @returns ISO string representing UTC midnight of that date
 */
export const toUTCStart = (date: Date): string => {
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  ));
  return utcDate.toISOString();
};

/**
 * Convert a date to UTC end of day (23:59:59.999)
 * @param date - Local date to convert
 * @returns ISO string representing UTC end of day for that date
 */
export const toUTCEnd = (date: Date): string => {
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23, 59, 59, 999
  ));
  return utcDate.toISOString();
};
