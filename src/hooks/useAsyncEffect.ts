import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle async operations in useEffect with proper cleanup
 * Prevents memory leaks and race conditions from async operations
 */
export const useAsyncEffect = (
  asyncEffect: () => Promise<void | (() => void)>,
  deps: React.DependencyList
) => {
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | void>();

  useEffect(() => {
    isMountedRef.current = true;
    
    const runAsyncEffect = async () => {
      try {
        if (isMountedRef.current) {
          cleanupRef.current = await asyncEffect();
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error('Async effect error:', error);
        }
      }
    };

    runAsyncEffect();

    return () => {
      isMountedRef.current = false;
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
    };
  }, deps);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
};