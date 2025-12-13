import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Zap, Bomb } from 'lucide-react';
import { ParticleExplosion } from '@/components/ParticleExplosion';
import { CountingNumber, PulseNumber } from '@/components/CountingNumber';

interface BalloonGameProps {
  onPlaceBet: (betAmount: string, target: number) => void;
  isPlaying: boolean;
  currentBalance: number;
  lastOutcome?: number | null;
  lastWon?: boolean | null;
}

function Balloon({
  scale,
  isPopping,
  won,
}: {
  scale: number;
  isPopping: boolean;
  won: boolean;
}) {
  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isPopping ? (
          <motion.div
            key="balloon"
            className="relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: [0, -5, 0],
            }}
            exit={{
              scale: won ? [1, 1.2, 0] : [1, 1.5, 0],
              opacity: 0,
            }}
            transition={{
              y: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              },
            }}
          >
            {/* Balloon body */}
            <motion.div
              className={`w-32 h-40 rounded-full relative ${
                won ? 'bg-gradient-to-b from-green-400 to-green-600' : 'bg-gradient-to-b from-red-400 to-red-600'
              }`}
              animate={{
                scale: [1, 1 + scale / 100, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
              style={{
                boxShadow: won
                  ? '0 10px 30px rgba(34, 197, 94, 0.5), inset -10px -10px 20px rgba(0, 0, 0, 0.2)'
                  : '0 10px 30px rgba(239, 68, 68, 0.5), inset -10px -10px 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Shine effect */}
              <div className="absolute top-6 left-8 w-8 h-12 bg-white/30 rounded-full blur-sm" />

              {/* Tie point */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-4 bg-gradient-to-b from-gray-700 to-transparent" />
            </motion.div>

            {/* String */}
            <motion.div
              className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 bg-gray-400"
              style={{ height: '60px' }}
              animate={{
                scaleY: [1, 0.95, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="pop-effect"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Pop explosion */}
            <Bomb className={`w-16 h-16 ${won ? 'text-green-500' : 'text-red-500'}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BalloonGame({
  onPlaceBet,
  isPlaying,
  currentBalance,
  lastOutcome,
  lastWon,
}: BalloonGameProps) {
  const [betAmount, setBetAmount] = useState('0.001');
  const [riskLevel, setRiskLevel] = useState(50);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [balloonScale, setBalloonScale] = useState(0);
  const [isPopping, setIsPopping] = useState(false);
  const previousOutcome = useRef<number | null | undefined>(lastOutcome);

  // Calculate multiplier based on risk
  const multiplier = 1 + (riskLevel / 10);
  const popChance = riskLevel;
  const potentialWin = parseFloat(betAmount) * multiplier;

  useEffect(() => {
    if (lastOutcome !== null && lastOutcome !== undefined && lastOutcome !== previousOutcome.current) {
      setIsPopping(true);

      // Animate balloon growing before pop
      let growth = 0;
      const growthInterval = setInterval(() => {
        growth += 5;
        setBalloonScale(growth);
        if (growth >= 50) {
          clearInterval(growthInterval);
        }
      }, 50);

      // Trigger pop after growth
      setTimeout(() => {
        setParticleTrigger((prev) => prev + 1);
        setShowResult(true);
        setIsPopping(false);
        setBalloonScale(0);
        previousOutcome.current = lastOutcome;
      }, 1500);

      return () => clearInterval(growthInterval);
    }
  }, [lastOutcome]);

  const handlePlaceBet = () => {
    if (parseFloat(betAmount) <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) > currentBalance) {
      alert('Insufficient balance');
      return;
    }

    setShowResult(false);
    setIsPopping(false);
    setBalloonScale(0);
    onPlaceBet(betAmount, riskLevel);
  };

  return (
    <div className="space-y-6">
      {/* Balloon Display */}
      <Card className="relative p-8 overflow-hidden backdrop-blur-sm bg-gradient-to-b from-sky-900/20 to-blue-900/20 border-2">
        {/* Sky background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/10 via-sky-500/5 to-transparent pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
        </div>

        {/* Particle Effect */}
        {lastWon !== null && lastWon !== undefined && (
          <ParticleExplosion isWin={lastWon} trigger={particleTrigger} />
        )}

        <div className="relative flex flex-col items-center justify-center space-y-6 min-h-[400px]">
          {/* Title */}
          <motion.h2
            className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            BALLOON BURST
          </motion.h2>

          {/* Balloon */}
          <div className="flex items-center justify-center py-12">
            <Balloon scale={balloonScale} isPopping={isPlaying || isPopping} won={lastWon || false} />
          </div>

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
                <motion.div
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${
                    lastWon ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  } border-2 ${lastWon ? 'border-green-500' : 'border-red-500'}`}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 0.5, repeat: 3 }}
                >
                  {lastWon ? (
                    <>
                      <Zap className="w-6 h-6" />
                      <span className="text-2xl font-bold">SAFE! +{multiplier.toFixed(2)}x</span>
                      <Zap className="w-6 h-6" />
                    </>
                  ) : (
                    <>
                      <Bomb className="w-6 h-6" />
                      <span className="text-2xl font-bold">POPPED!</span>
                      <Bomb className="w-6 h-6" />
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Risk Indicator */}
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-500 font-medium">Safe Zone</span>
              <span className="text-red-500 font-medium">Danger Zone</span>
            </div>
            <div className="h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full relative overflow-hidden shadow-lg">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
              />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white shadow-xl rounded-full"
                style={{ left: `${popChance}%` }}
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
          </motion.div>
        </div>
      </Card>

      {/* Bet Controls */}
      <Card className="relative p-6 overflow-hidden backdrop-blur-sm bg-card/95 border-2">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        <motion.div
          className="space-y-6 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Bet Amount */}
          <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Label htmlFor="balloonBetAmount">Bet Amount</Label>
            <Input
              id="balloonBetAmount"
              type="number"
              step="0.001"
              min="0"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={isPlaying}
              className="mt-1.5"
            />
            <div className="flex gap-2 mt-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(8))}
                  disabled={isPlaying}
                >
                  ½
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(8))}
                  disabled={isPlaying}
                >
                  2×
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(currentBalance.toFixed(8))}
                  disabled={isPlaying}
                >
                  Max
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Risk Level */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>Risk Level</Label>
              <span className="text-sm font-medium">{riskLevel}%</span>
            </div>
            <Slider
              value={[riskLevel]}
              onValueChange={(values) => setRiskLevel(values[0])}
              min={1}
              max={99}
              step={1}
              disabled={isPlaying}
            />
          </div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-lg border border-sky-500/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div>
              <p className="text-xs text-muted-foreground">Pop Chance</p>
              <p className="text-lg font-semibold text-red-400">
                <PulseNumber value={popChance} decimals={0} />%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Multiplier</p>
              <p className="text-lg font-semibold flex items-center text-green-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                <PulseNumber value={multiplier} decimals={2} />×
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Potential Win</p>
              <p className="text-lg font-semibold text-green-500">
                <CountingNumber value={potentialWin} decimals={8} />
              </p>
            </div>
          </motion.div>

          {/* Inflate Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full relative overflow-hidden bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
              size="lg"
              onClick={handlePlaceBet}
              disabled={isPlaying}
            >
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                />
              )}
              <span className="relative z-10">
                {isPlaying ? 'Inflating...' : 'Inflate Balloon'}
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </Card>
    </div>
  );
}
