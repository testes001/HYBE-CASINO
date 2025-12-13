import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface QuickBetControlsProps {
  betAmount: string;
  onSetBetAmount: (amount: string) => void;
  disabled?: boolean;
  currentBalance: number;
}

const QUICK_BETS = ['0.001', '0.01', '0.1', '1.0'];

export function QuickBetControls({
  betAmount,
  onSetBetAmount,
  disabled,
  currentBalance,
}: QuickBetControlsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="w-3 h-3" />
        <span>Quick Bet</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {QUICK_BETS.map((amount) => {
          const isActive = parseFloat(betAmount) === parseFloat(amount);
          const canAfford = parseFloat(amount) <= currentBalance;

          return (
            <motion.div
              key={amount}
              whileHover={{ scale: canAfford ? 1.05 : 1 }}
              whileTap={{ scale: canAfford ? 0.95 : 1 }}
            >
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSetBetAmount(amount)}
                disabled={disabled || !canAfford}
                className={`w-full text-xs ${isActive ? 'ring-2 ring-primary' : ''}`}
              >
                {amount}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
