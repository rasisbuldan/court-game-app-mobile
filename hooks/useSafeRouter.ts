import { useRouter as useExpoRouter } from 'expo-router';
import { useEffect, useState } from 'react';

/**
 * Safe wrapper around expo-router's useRouter hook
 * Returns a router that safely handles navigation context not being ready
 */
export function useSafeRouter() {
  const [isReady, setIsReady] = useState(false);

  // Try to get router, but handle error gracefully
  let router: ReturnType<typeof useExpoRouter> | null = null;
  let error: Error | null = null;

  try {
    router = useExpoRouter();
  } catch (e) {
    error = e as Error;
  }

  useEffect(() => {
    if (router && !error) {
      setIsReady(true);
    }
  }, [router, error]);

  // If router is not available, return a no-op router
  if (!router || error) {
    return {
      push: (...args: any[]) => {
        console.log('[useSafeRouter] Navigation context not ready, ignoring push:', args);
      },
      replace: (...args: any[]) => {
        console.log('[useSafeRouter] Navigation context not ready, ignoring replace:', args);
      },
      back: () => {
        console.log('[useSafeRouter] Navigation context not ready, ignoring back');
      },
      canGoBack: () => false,
      setParams: () => {
        console.log('[useSafeRouter] Navigation context not ready, ignoring setParams');
      },
    } as ReturnType<typeof useExpoRouter>;
  }

  return router;
}
