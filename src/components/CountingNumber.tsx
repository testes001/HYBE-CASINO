import { useCallback, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface CountingNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function CountingNumber({
  value,
  decimals = 8,
  duration = 0.8,
  className = '',
  prefix = '',
  suffix = '',
}: CountingNumberProps) {
  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000,
  });

  // Memoize the transform function to prevent re-creation on every render.
  // This is a micro-optimization, but beneficial given the component's
  // widespread use in games and the main balance display.
  const transformFn = useCallback(
    (current: number) => current.toFixed(decimals),
    [decimals]
  );
  const display = useTransform(spring, transformFn);

  const previousValue = useRef(0);

  useEffect(() => {
    if (previousValue.current !== value) {
      spring.set(value);
      previousValue.current = value;
    }
  }, [value, spring]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}

interface PulseNumberProps {
  value: number;
  decimals?: number;
  className?: string;
  isPositive?: boolean;
}

export function PulseNumber({ value, decimals = 2, className = '', isPositive }: PulseNumberProps) {
  const previousValue = useRef(value);
  const hasChanged = previousValue.current !== value;

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  const getColorAnimation = () => {
    if (isPositive === undefined) return undefined;
    const targetColor = isPositive ? '#22c55e' : '#ef4444';
    return ['currentColor', targetColor, 'currentColor'];
  };

  return (
    <motion.span
      className={className}
      animate={
        hasChanged
          ? {
              scale: [1, 1.2, 1],
              color: getColorAnimation(),
            }
          : {}
      }
      transition={{ duration: 0.3 }}
    >
      {value.toFixed(decimals)}
    </motion.span>
  );
}
