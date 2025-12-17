import { memo, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface CountingNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

// Performance: Wrapped with React.memo to prevent re-renders unless props change.
export const CountingNumber = memo(
  ({
    value,
    decimals = 8,
    duration = 0.8,
    className = '',
    prefix = '',
    suffix = '',
  }: CountingNumberProps) => {
    const spring = useSpring(0, {
      mass: 0.8,
      stiffness: 75,
      damping: 15,
      duration: duration * 1000,
    });

    const display = useTransform(spring, (current) =>
      current.toFixed(decimals)
    );

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
);

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
