import { useCallback } from 'react';

export interface HapticFeedback {
  light: () => void;
  medium: () => void;
  heavy: () => void;
  success: () => void;
  error: () => void;
}

export function useHaptic(): HapticFeedback {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const light = useCallback(() => {
    vibrate(10);
  }, [vibrate]);

  const medium = useCallback(() => {
    vibrate(20);
  }, [vibrate]);

  const heavy = useCallback(() => {
    vibrate(30);
  }, [vibrate]);

  const success = useCallback(() => {
    vibrate([10, 50, 10]);
  }, [vibrate]);

  const error = useCallback(() => {
    vibrate([20, 30, 20]);
  }, [vibrate]);

  return {
    light,
    medium,
    heavy,
    success,
    error,
  };
}
