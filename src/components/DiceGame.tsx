import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Sparkles, Keyboard } from 'lucide-react';
import { calculateMultiplier } from '@/lib/provably-fair';
import { AnimatedDice } from '@/components/AnimatedDice';
import { ParticleExplosion } from '@/components/ParticleExplosion';
import { CountingNumber, PulseNumber } from '@/components/CountingNumber';
import { QuickBetControls } from '@/components/QuickBetControls';
import { BetPresets } from '@/components/BetPresets';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface DiceGameProps {
  onPlaceBet: (betAmount: string, target: number) => void;
  isPlaying: boolean;
  currentBalance: number;
  lastOutcome?: number | null;
  lastWon?: boolean | null;
}

export function DiceGame({
  onPlaceBet,
  isPlaying,
  currentBalance,
  lastOutcome,
  lastWon,
}: DiceGameProps) {
  const [betAmount, setBetAmount] = useState('0.001');
  const [target, setTarget] = useState(50);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const previousOutcome = useRef<number | null | undefined>(lastOutcome);

  const sound = useSound();
  const haptic = useHaptic();
  const prefersReducedMotion = useReducedMotion();

  const multiplier = calculateMultiplier(target);
  const winChance = target;
  const potentialWin = parseFloat(betAmount) * multiplier;

  // Trigger particle effect when result changes
  useEffect(() => {
    if (lastOutcome !== null && lastOutcome !== undefined && lastOutcome !== previousOutcome.current) {
      setParticleTrigger((prev) => prev + 1);
      setShowResult(true);
      previousOutcome.current = lastOutcome;

      // Play sounds and haptic feedback
      if (lastWon) {
        sound.playWin();
        haptic.success();
      } else {
        sound.playLose();
        haptic.error();
      }
    }
  }, [lastOutcome, lastWon, sound, haptic]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isPlaying) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handlePlaceBet();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setTarget(prev => Math.min(99, prev + 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setTarget(prev => Math.max(1, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, betAmount, target]);

  const handlePlaceBet = () => {
    if (parseFloat(betAmount) <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) > currentBalance) {
      alert('Insufficient balance');
      return;
    }

    sound.playSpin();
    haptic.light();
    onPlaceBet(betAmount, target);
  };

  return (
    <div className="space-y-6">
      {/* Game Visualization */}
      <Card className="relative p-8 overflow-hidden backdrop-blur-sm bg-card/95 border-2">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        {/* Particle Effect */}
        {lastWon !== null && lastWon !== undefined && (
          <ParticleExplosion isWin={lastWon} trigger={particleTrigger} />
        )}

        <div className="relative flex flex-col items-center justify-center space-y-6">
          {/* Animated Dice */}
          <motion.div
            className="py-8"
            initial={{ scale: 1 }}
            animate={{ scale: isPlaying && !prefersReducedMotion ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: isPlaying && !prefersReducedMotion ? Number.POSITIVE_INFINITY : 0, duration: 0.5 }}
          >
            <AnimatedDice
              isRolling={isPlaying}
              outcome={lastOutcome}
            />
          </motion.div>

          {/* Result Display */}
          <AnimatePresence mode="wait">
            {lastOutcome !== null && lastOutcome !== undefined && !isPlaying && showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
                className="text-center"
              >
                <p className="text-sm text-muted-foreground mb-1">Last Roll</p>
                <motion.p
                  className="text-5xl font-bold mb-2"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                >
                  <PulseNumber value={lastOutcome} decimals={2} />
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    lastWon ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {lastWon && <Sparkles className="w-4 h-4" />}
                  <span className="text-lg font-semibold">
                    {lastWon ? 'You Won!' : 'You Lost'}
                  </span>
                  {lastWon && <Sparkles className="w-4 h-4" />}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Target Indicator */}
        <motion.div
          className="mt-6 relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between text-sm mb-2">
            <motion.span
              className="text-green-500 font-medium"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              Win Zone (&lt; {target})
            </motion.span>
            <motion.span
              className="text-red-500 font-medium"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
            >
              Lose Zone (&gt;= {target})
            </motion.span>
          </div>
          <div className="h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full relative overflow-hidden shadow-lg">
            {/* Animated shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white shadow-xl rounded-full"
              style={{ left: `${target}%` }}
              animate={{
                boxShadow: [
                  '0 0 10px rgba(255,255,255,0.5)',
                  '0 0 20px rgba(255,255,255,0.8)',
                  '0 0 10px rgba(255,255,255,0.5)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </motion.div>
      </Card>

      {/* Bet Controls */}
      <Card className="relative p-6 overflow-hidden backdrop-blur-sm bg-card/95 border-2">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none" />

        <motion.div
          className="space-y-6 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Bet Amount */}
          <motion.div
            whileHover={{ scale: prefersReducedMotion ? 1 : 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Label htmlFor="betAmount">Bet Amount</Label>
            <Input
              id="betAmount"
              type="number"
              step="0.001"
              min="0"
              value={betAmount}
              onChange={e => setBetAmount(e.target.value)}
              disabled={isPlaying}
              className="mt-1.5"
            />
            <div className="flex gap-2 mt-2">
              <motion.div whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }} whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    sound.playClick();
                    setBetAmount((parseFloat(betAmount) / 2).toFixed(8));
                  }}
                  disabled={isPlaying}
                >
                  ½
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }} whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    sound.playClick();
                    setBetAmount((parseFloat(betAmount) * 2).toFixed(8));
                  }}
                  disabled={isPlaying}
                >
                  2×
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }} whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    sound.playClick();
                    setBetAmount(currentBalance.toFixed(8));
                  }}
                  disabled={isPlaying}
                >
                  Max
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Quick Bet Controls */}
          <QuickBetControls
            betAmount={betAmount}
            onSetBetAmount={(amount) => {
              sound.playClick();
              setBetAmount(amount);
            }}
            disabled={isPlaying}
            currentBalance={currentBalance}
          />

          {/* Bet Presets */}
          <BetPresets
            currentBalance={currentBalance}
            onSelectPreset={(amount) => {
              sound.playClick();
              setBetAmount(amount);
            }}
            disabled={isPlaying}
          />

          {/* Target */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>Roll Under</Label>
              <span className="text-sm font-medium">{target.toFixed(2)}</span>
            </div>
            <Slider
              value={[target]}
              onValueChange={values => setTarget(values[0])}
              min={1}
              max={99}
              step={0.01}
              disabled={isPlaying}
            />
          </div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border border-border/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div>
              <p className="text-xs text-muted-foreground">Win Chance</p>
              <p className="text-lg font-semibold">
                <PulseNumber value={winChance} decimals={2} />%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Multiplier</p>
              <p className="text-lg font-semibold flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                <PulseNumber value={multiplier} decimals={4} />×
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Potential Win</p>
              <p className="text-lg font-semibold text-green-500">
                <CountingNumber value={potentialWin} decimals={8} />
              </p>
            </div>
          </motion.div>

          {/* Keyboard Shortcuts Hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="w-3 h-3" />
            <span>Enter to bet • ↑↓ to adjust target</span>
          </div>

          {/* Place Bet Button */}
          <motion.div
            whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
          >
            <Button
              className="w-full relative overflow-hidden"
              size="lg"
              onClick={handlePlaceBet}
              disabled={isPlaying}
            >
              {isPlaying && !prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                />
              )}
              <span className="relative z-10">
                {isPlaying ? 'Rolling...' : 'Place Bet (Enter)'}
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </Card>
    </div>
  );
}
