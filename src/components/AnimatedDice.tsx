import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedDiceProps {
  isRolling: boolean;
  outcome?: number | null;
  onRollComplete?: () => void;
}

// Map outcome numbers (1-100) to dice face combinations
function getDiceFaces(outcome: number): [number, number] {
  // Convert outcome (1-100) into two dice faces (1-6)
  // Use modulo to create variation while maintaining deterministic result
  const die1 = ((Math.floor(outcome / 16.67) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  const die2 = ((Math.floor(outcome / 14.29) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  return [die1, die2];
}

// Dice dot positions for each face
const DICE_DOTS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]], // center
  2: [[30, 30], [70, 70]], // diagonal
  3: [[30, 30], [50, 50], [70, 70]], // diagonal with center
  4: [[30, 30], [70, 30], [30, 70], [70, 70]], // corners
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]], // corners + center
  6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]], // two columns
};

function DiceFace({ value, className }: { value: number; className?: string }) {
  const dots = DICE_DOTS[value] || [];

  return (
    <div className={cn(
      "w-20 h-20 bg-white rounded-xl shadow-2xl border-2 border-gray-200 relative",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:rounded-xl",
      className
    )}>
      {dots.map(([x, y], i) => (
        <div
          key={i}
          className="absolute w-3 h-3 bg-gray-900 rounded-full shadow-sm"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

export function AnimatedDice({ isRolling, outcome, onRollComplete }: AnimatedDiceProps) {
  const [dice1Value, setDice1Value] = useState(1);
  const [dice2Value, setDice2Value] = useState(1);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'rolling' | 'landing'>('idle');

  useEffect(() => {
    if (isRolling) {
      setAnimationPhase('rolling');

      // Simulate rapid changes during roll
      const interval = setInterval(() => {
        setDice1Value(Math.floor(Math.random() * 6) + 1);
        setDice2Value(Math.floor(Math.random() * 6) + 1);
      }, 100);

      // After 1.5s, start landing animation
      const landingTimeout = setTimeout(() => {
        clearInterval(interval);
        setAnimationPhase('landing');

        if (outcome !== null && outcome !== undefined) {
          const [final1, final2] = getDiceFaces(outcome);
          setDice1Value(final1);
          setDice2Value(final2);
        }

        // Complete animation after landing
        const completeTimeout = setTimeout(() => {
          setAnimationPhase('idle');
          onRollComplete?.();
        }, 600);

        return () => clearTimeout(completeTimeout);
      }, 1500);

      return () => {
        clearInterval(interval);
        clearTimeout(landingTimeout);
      };
    }
  }, [isRolling, outcome, onRollComplete]);

  return (
    <div className="flex gap-6 items-center justify-center perspective-1000">
      {/* Dice 1 */}
      <div className={cn(
        "transition-all duration-300 ease-out",
        animationPhase === 'rolling' && "animate-dice-roll-1",
        animationPhase === 'landing' && "animate-dice-land",
      )}>
        <DiceFace value={dice1Value} />
      </div>

      {/* Dice 2 */}
      <div className={cn(
        "transition-all duration-300 ease-out",
        animationPhase === 'rolling' && "animate-dice-roll-2",
        animationPhase === 'landing' && "animate-dice-land",
      )}>
        <DiceFace value={dice2Value} />
      </div>
    </div>
  );
}
