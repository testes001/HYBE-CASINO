import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Circle, TrendingUp, Sparkles } from 'lucide-react';
import { ParticleExplosion } from '@/components/ParticleExplosion';
import { CountingNumber, PulseNumber } from '@/components/CountingNumber';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface RouletteGameProps {
  onPlaceBet: (betAmount: string, target: number) => void;
  isPlaying: boolean;
  currentBalance: number;
  lastOutcome?: number | null;
  lastWon?: boolean | null;
}

// Mini roulette numbers (0-12)
const ROULETTE_NUMBERS = [
  { value: 0, color: 'green' },
  { value: 1, color: 'red' },
  { value: 2, color: 'black' },
  { value: 3, color: 'red' },
  { value: 4, color: 'black' },
  { value: 5, color: 'red' },
  { value: 6, color: 'black' },
  { value: 7, color: 'red' },
  { value: 8, color: 'black' },
  { value: 9, color: 'red' },
  { value: 10, color: 'black' },
  { value: 11, color: 'red' },
  { value: 12, color: 'black' },
];

function getColorFromOutcome(outcome: number): string {
  const index = Math.floor((outcome / 100) * ROULETTE_NUMBERS.length);
  const clampedIndex = Math.max(0, Math.min(ROULETTE_NUMBERS.length - 1, index));
  return ROULETTE_NUMBERS[clampedIndex].color;
}

function getNumberFromOutcome(outcome: number): number {
  const index = Math.floor((outcome / 100) * ROULETTE_NUMBERS.length);
  return Math.max(0, Math.min(ROULETTE_NUMBERS.length - 1, index));
}

function RouletteWheel({
  isSpinning,
  winningNumber,
}: {
  isSpinning: boolean;
  winningNumber: number | null;
}) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isSpinning && winningNumber !== null) {
      // Calculate target rotation
      const degreesPerNumber = 360 / ROULETTE_NUMBERS.length;
      const targetRotation = -(winningNumber * degreesPerNumber) + 360 * 5; // 5 full spins + target
      setRotation(targetRotation);
    } else if (!isSpinning) {
      setRotation(0);
    }
  }, [isSpinning, winningNumber]);

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Outer rim */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-2xl">
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-700 to-yellow-900" />
      </div>

      {/* Rotating wheel */}
      <motion.div
        className="absolute inset-4 rounded-full overflow-hidden"
        animate={{ rotate: rotation }}
        transition={{
          duration: isSpinning ? 3 : 0,
          ease: isSpinning ? [0.45, 0.05, 0.15, 1] : 'linear',
        }}
      >
        {ROULETTE_NUMBERS.map((number, index) => {
          const angle = (index * 360) / ROULETTE_NUMBERS.length;
          const nextAngle = ((index + 1) * 360) / ROULETTE_NUMBERS.length;

          let bgColor = '#1f2937'; // black
          if (number.color === 'red') bgColor = '#dc2626';
          if (number.color === 'green') bgColor = '#16a34a';

          return (
            <div
              key={index}
              className="absolute inset-0"
              style={{
                clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle * Math.PI) / 180)}% ${
                  50 + 50 * Math.sin((angle * Math.PI) / 180)
                }%, ${50 + 50 * Math.cos((nextAngle * Math.PI) / 180)}% ${
                  50 + 50 * Math.sin((nextAngle * Math.PI) / 180)
                }%)`,
                backgroundColor: bgColor,
              }}
            >
              <div
                className="absolute text-white font-bold text-sm"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${angle + 360 / ROULETTE_NUMBERS.length / 2}deg) translateY(-120px)`,
                }}
              >
                {number.value}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Center circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-xl flex items-center justify-center">
          <Circle className="w-8 h-8 text-yellow-900" />
        </div>
      </div>

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <motion.div
          className="w-6 h-8 bg-white rounded-b-lg shadow-xl"
          style={{
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          }}
          animate={{
            scale: isSpinning ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 0.3,
            repeat: isSpinning ? Number.POSITIVE_INFINITY : 0,
          }}
        />
      </div>
    </div>
  );
}

type BetType = 'red' | 'black' | 'green' | 'even' | 'odd' | 'low' | 'high';

export function RouletteGame({
  onPlaceBet,
  isPlaying,
  currentBalance,
  lastOutcome,
  lastWon,
}: RouletteGameProps) {
  const [betAmount, setBetAmount] = useState('0.001');
  const [betType, setBetType] = useState<BetType>('red');
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [winningColor, setWinningColor] = useState<string>('');
  const previousOutcome = useRef<number | null | undefined>(lastOutcome);

  useEffect(() => {
    if (lastOutcome !== null && lastOutcome !== undefined && lastOutcome !== previousOutcome.current) {
      const number = getNumberFromOutcome(lastOutcome);
      const color = getColorFromOutcome(lastOutcome);

      setWinningNumber(number);
      setWinningColor(color);

      setTimeout(() => {
        setParticleTrigger((prev) => prev + 1);
        setShowResult(true);
        previousOutcome.current = lastOutcome;
      }, 3000);
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

    if (!betType) {
      alert('Please select a bet type');
      return;
    }

    setShowResult(false);
    setWinningNumber(null);

    // Map bet type to target value for backend
    let target = 50;
    if (betType === 'red' || betType === 'black') target = 48; // ~48% win chance
    if (betType === 'green') target = 8; // ~8% win chance (0 only)
    if (betType === 'even' || betType === 'odd') target = 46; // ~46% win chance
    if (betType === 'low' || betType === 'high') target = 46; // ~46% win chance

    onPlaceBet(betAmount, target);
  };

  // Calculate multiplier based on bet type
  const getMultiplier = () => {
    if (betType === 'green') return 12; // 0 pays 12:1
    if (betType === 'red' || betType === 'black') return 2; // Color pays 2:1
    if (betType === 'even' || betType === 'odd') return 2; // Even/Odd pays 2:1
    if (betType === 'low' || betType === 'high') return 2; // Low/High pays 2:1
    return 2;
  };

  const multiplier = getMultiplier();
  const potentialWin = parseFloat(betAmount) * multiplier;

  return (
    <div className="space-y-6">
      {/* Roulette Wheel */}
      <Card className="relative p-8 overflow-hidden backdrop-blur-sm bg-gradient-to-b from-yellow-900/20 to-red-900/20 border-2 border-yellow-500/30">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-red-500/5 to-orange-500/5 pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          />
        </div>

        {/* Particle Effect */}
        {lastWon !== null && lastWon !== undefined && (
          <ParticleExplosion isWin={lastWon} trigger={particleTrigger} />
        )}

        <div className="relative flex flex-col items-center justify-center space-y-6">
          {/* Title */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Circle className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
              MINI ROULETTE
            </h2>
            <Circle className="w-8 h-8 text-red-500" />
          </motion.div>

          {/* Wheel */}
          <RouletteWheel isSpinning={isPlaying} winningNumber={winningNumber} />

          {/* Result Display */}
          <AnimatePresence mode="wait">
            {winningNumber !== null && !isPlaying && showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
                className="text-center"
              >
                <div className="flex flex-col gap-2">
                  <motion.div
                    className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full ${
                      winningColor === 'red' ? 'bg-red-500' : winningColor === 'green' ? 'bg-green-500' : 'bg-gray-800'
                    } text-white border-4 border-white shadow-2xl`}
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 0.5, repeat: 3 }}
                  >
                    <span className="text-4xl font-bold">{winningNumber}</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`inline-flex items-center gap-2 px-6 py-2 rounded-full ${
                      lastWon ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-red-500/20 text-red-400 border-red-500'
                    } border-2`}
                  >
                    {lastWon && <Sparkles className="w-5 h-5" />}
                    <span className="text-lg font-bold">{lastWon ? 'YOU WIN!' : 'TRY AGAIN'}</span>
                    {lastWon && <Sparkles className="w-5 h-5" />}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Bet Controls */}
      <Card className="relative p-6 overflow-hidden backdrop-blur-sm bg-card/95 border-2">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-red-500/5 pointer-events-none" />

        <motion.div
          className="space-y-6 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Bet Amount */}
          <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Label htmlFor="rouletteBetAmount">Bet Amount</Label>
            <Input
              id="rouletteBetAmount"
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

          {/* Bet Type Selection */}
          <div>
            <Label className="mb-3 block">Bet Type</Label>
            <ToggleGroup type="single" value={betType} onValueChange={(value) => value && setBetType(value as BetType)} className="grid grid-cols-4 gap-2">
              <ToggleGroupItem value="red" className="bg-red-500/20 hover:bg-red-500/30 border-red-500 data-[state=on]:bg-red-500 data-[state=on]:text-white">
                Red (2x)
              </ToggleGroupItem>
              <ToggleGroupItem value="black" className="bg-gray-800/50 hover:bg-gray-800/70 border-gray-600 data-[state=on]:bg-gray-800 data-[state=on]:text-white">
                Black (2x)
              </ToggleGroupItem>
              <ToggleGroupItem value="green" className="bg-green-500/20 hover:bg-green-500/30 border-green-500 data-[state=on]:bg-green-500 data-[state=on]:text-white">
                0 (12x)
              </ToggleGroupItem>
              <ToggleGroupItem value="even" className="bg-blue-500/20 hover:bg-blue-500/30 border-blue-500 data-[state=on]:bg-blue-500 data-[state=on]:text-white">
                Even (2x)
              </ToggleGroupItem>
              <ToggleGroupItem value="odd" className="bg-purple-500/20 hover:bg-purple-500/30 border-purple-500 data-[state=on]:bg-purple-500 data-[state=on]:text-white">
                Odd (2x)
              </ToggleGroupItem>
              <ToggleGroupItem value="low" className="bg-orange-500/20 hover:bg-orange-500/30 border-orange-500 data-[state=on]:bg-orange-500 data-[state=on]:text-white">
                Low 1-6 (2x)
              </ToggleGroupItem>
              <ToggleGroupItem value="high" className="bg-pink-500/20 hover:bg-pink-500/30 border-pink-500 data-[state=on]:bg-pink-500 data-[state=on]:text-white">
                High 7-12 (2x)
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-red-500/10 rounded-lg border border-yellow-500/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div>
              <p className="text-xs text-muted-foreground">Multiplier</p>
              <p className="text-lg font-semibold flex items-center text-yellow-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                <PulseNumber value={multiplier} decimals={0} />×
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Potential Win</p>
              <p className="text-lg font-semibold text-green-500">
                <CountingNumber value={potentialWin} decimals={8} />
              </p>
            </div>
          </motion.div>

          {/* Spin Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full relative overflow-hidden bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-black font-bold text-lg"
              size="lg"
              onClick={handlePlaceBet}
              disabled={isPlaying}
            >
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isPlaying ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                    >
                      <Circle className="w-5 h-5" />
                    </motion.div>
                    SPINNING...
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5" />
                    SPIN WHEEL
                  </>
                )}
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </Card>
    </div>
  );
}
