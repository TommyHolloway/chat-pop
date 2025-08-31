/**
 * API utility functions with proper error handling and retry logic
 */

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 5000 } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    })
  ]);
};

export const isNetworkError = (error: any): boolean => {
  return (
    error?.name === 'NetworkError' ||
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('fetch') ||
    error?.message?.includes('network')
  );
};

export const isRetryableError = (error: any): boolean => {
  if (isNetworkError(error)) return true;
  
  const status = error?.status || error?.response?.status;
  return status >= 500 || status === 429; // Server errors or rate limiting
};