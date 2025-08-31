/**
 * Input validation utilities with proper sanitization
 */

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic XSS characters
    .substring(0, 1000); // Limit length
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateUrlPatterns = (patterns: string[]): string[] => {
  return patterns
    .map(pattern => sanitizeInput(pattern))
    .filter(pattern => pattern.length > 0 && pattern.length <= 100)
    .slice(0, 20); // Limit number of patterns
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
};