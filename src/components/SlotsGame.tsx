import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cherry, Sparkles, Coins, Flame } from 'lucide-react';
import { ParticleExplosion } from '@/components/ParticleExplosion';
import { CountingNumber, PulseNumber } from '@/components/CountingNumber';

interface SlotsGameProps {
  onPlaceBet: (betAmount: string, target: number) => void;
  isPlaying: boolean;
  currentBalance: number;
  lastOutcome?: number | null;
  lastWon?: boolean | null;
}

// Slot symbols with their multipliers
const SYMBOLS = [
  { icon: '🍒', name: 'cherry', multiplier: 2, color: '#ef4444' },
  { icon: '🍋', name: 'lemon', multiplier: 3, color: '#eab308' },
  { icon: '🍊', name: 'orange', multiplier: 4, color: '#f97316' },
  { icon: '🍇', name: 'grape', multiplier: 5, color: '#a855f7' },
  { icon: '💎', name: 'diamond', multiplier: 8, color: '#06b6d4' },
  { icon: '⭐', name: 'star', multiplier: 10, color: '#fbbf24' },
  { icon: '7️⃣', name: 'seven', multiplier: 20, color: '#22c55e' },
];

function getSymbolFromOutcome(outcome: number, reelIndex: number): typeof SYMBOLS[number] {
  // Use outcome and reel index to deterministically select a symbol
  const hash = (outcome * (reelIndex + 1) * 13) % 100;

  // Weighted distribution (higher multipliers are rarer)
  if (hash < 25) return SYMBOLS[0]; // Cherry - 25%
  if (hash < 45) return SYMBOLS[1]; // Lemon - 20%
  if (hash < 63) return SYMBOLS[2]; // Orange - 18%
  if (hash < 78) return SYMBOLS[3]; // Grape - 15%
  if (hash < 88) return SYMBOLS[4]; // Diamond - 10%
  if (hash < 95) return SYMBOLS[5]; // Star - 7%
  return SYMBOLS[6]; // Seven - 5%
}

function calculateSlotsWin(symbols: typeof SYMBOLS[number][]): { won: boolean; multiplier: number } {
  // Check for three of a kind
  if (symbols[0].name === symbols[1].name && symbols[1].name === symbols[2].name) {
    return { won: true, multiplier: symbols[0].multiplier };
  }

  // Check for two of a kind (partial win)
  if (symbols[0].name === symbols[1].name || symbols[1].name === symbols[2].name) {
    const symbol = symbols[0].name === symbols[1].name ? symbols[0] : symbols[1];
    return { won: true, multiplier: symbol.multiplier * 0.5 };
  }

  return { won: false, multiplier: 0 };
}

function SlotReel({
  symbol,
  isSpinning,
  delay
}: {
  symbol: typeof SYMBOLS[number];
  isSpinning: boolean;
  delay: number;
}) {
  const [displaySymbol, setDisplaySymbol] = useState(symbol);
  const [spinOffset, setSpinOffset] = useState(0);

  useEffect(() => {
    if (isSpinning) {
      let offset = 0;
      const interval = setInterval(() => {
        offset += 120; // Height of each symbol slot
        setSpinOffset(offset);
        // Randomly change symbol during spin
        setDisplaySymbol(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }, 50);

      return () => clearInterval(interval);
    } else {
      setSpinOffset(0);
      setDisplaySymbol(symbol);
    }
  }, [isSpinning, symbol]);

  return (
    <div className="relative w-24 h-32 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg border-4 border-yellow-500/50 overflow-hidden shadow-2xl">
      {/* Reel glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent pointer-events-none" />

      {/* Symbol display */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          y: isSpinning ? [0, -20, 0] : 0,
        }}
        transition={{
          duration: 0.1,
          repeat: isSpinning ? Number.POSITIVE_INFINITY : 0,
          delay: delay,
        }}
      >
        <motion.div
          className="text-6xl filter drop-shadow-lg"
          animate={{
            scale: isSpinning ? [1, 0.9, 1] : 1,
            filter: isSpinning ? ['blur(0px)', 'blur(4px)', 'blur(0px)'] : 'blur(0px)',
          }}
          transition={{
            duration: 0.2,
            repeat: isSpinning ? Number.POSITIVE_INFINITY : 0,
          }}
        >
          {displaySymbol.icon}
        </motion.div>
      </motion.div>

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: isSpinning ? ['-100%', '200%'] : '-100%',
        }}
        transition={{
          duration: 1,
          repeat: isSpinning ? Number.POSITIVE_INFINITY : 0,
          ease: 'linear',
        }}
      />
    </div>
  );
}

export function SlotsGame({
  onPlaceBet,
  isPlaying,
  currentBalance,
  lastOutcome,
  lastWon,
}: SlotsGameProps) {
  const [betAmount, setBetAmount] = useState('0.001');
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [reelSymbols, setReelSymbols] = useState<typeof SYMBOLS[number][]>([
    SYMBOLS[0],
    SYMBOLS[0],
    SYMBOLS[0],
  ]);
  const [winMultiplier, setWinMultiplier] = useState(0);
  const previousOutcome = useRef<number | null | undefined>(lastOutcome);

  useEffect(() => {
    if (lastOutcome !== null && lastOutcome !== undefined && lastOutcome !== previousOutcome.current) {
      // Calculate reel symbols from outcome
      const symbols = [
        getSymbolFromOutcome(lastOutcome, 0),
        getSymbolFromOutcome(lastOutcome, 1),
        getSymbolFromOutcome(lastOutcome, 2),
      ];

      setReelSymbols(symbols);

      const result = calculateSlotsWin(symbols);
      setWinMultiplier(result.multiplier);

      setParticleTrigger((prev) => prev + 1);
      setShowResult(true);
      previousOutcome.current = lastOutcome;
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
    // Use 50 as default target for slots (50% base win chance)
    onPlaceBet(betAmount, 50);
  };

  const potentialWin = parseFloat(betAmount) * 10; // Max multiplier for 777

  return (
    <div className="space-y-6">
      {/* Slots Machine */}
      <Card className="relative p-8 overflow-hidden backdrop-blur-sm bg-gradient-to-b from-yellow-900/20 to-purple-900/20 border-2 border-yellow-500/30">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
        </div>

        {/* Particle Effect */}
        {lastWon !== null && lastWon !== undefined && (
          <ParticleExplosion isWin={lastWon} trigger={particleTrigger} />
        )}

        <div className="relative flex flex-col items-center justify-center space-y-6">
          {/* Slots Title */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Cherry className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
              LUCKY 777
            </h2>
            <Cherry className="w-8 h-8 text-yellow-500" />
          </motion.div>

          {/* Reels Container */}
          <div className="relative p-6 bg-gradient-to-b from-red-900/30 to-gray-900/50 rounded-2xl border-4 border-yellow-500 shadow-2xl">
            <motion.div
              className="flex gap-4 relative z-10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <SlotReel symbol={reelSymbols[0]} isSpinning={isPlaying} delay={0} />
              <SlotReel symbol={reelSymbols[1]} isSpinning={isPlaying} delay={0.1} />
              <SlotReel symbol={reelSymbols[2]} isSpinning={isPlaying} delay={0.2} />
            </motion.div>

            {/* Corner decorations */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-400" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-400" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-400" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-400" />
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
                    lastWon ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  } border-2 ${lastWon ? 'border-yellow-500' : 'border-red-500'}`}
                  animate={{
                    boxShadow: lastWon
                      ? ['0 0 20px rgba(234, 179, 8, 0.5)', '0 0 40px rgba(234, 179, 8, 0.8)', '0 0 20px rgba(234, 179, 8, 0.5)']
                      : 'none',
                  }}
                  transition={{ duration: 1, repeat: lastWon ? Number.POSITIVE_INFINITY : 0 }}
                >
                  {lastWon && <Sparkles className="w-6 h-6" />}
                  <span className="text-2xl font-bold">
                    {lastWon ? `${winMultiplier.toFixed(2)}x WIN!` : 'TRY AGAIN'}
                  </span>
                  {lastWon && <Sparkles className="w-6 h-6" />}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Paytable Preview */}
          <motion.div
            className="grid grid-cols-4 gap-2 p-4 bg-black/30 rounded-lg border border-yellow-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {SYMBOLS.slice(0, 4).map((symbol, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{symbol.icon}</span>
                <span className="text-xs text-yellow-400 font-bold">{symbol.multiplier}x</span>
              </div>
            ))}
          </motion.div>
        </div>
      </Card>

      {/* Bet Controls */}
      <Card className="relative p-6 overflow-hidden backdrop-blur-sm bg-card/95 border-2">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <motion.div
          className="space-y-6 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Bet Amount */}
          <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Label htmlFor="slotsBetAmount">Bet Amount</Label>
            <Input
              id="slotsBetAmount"
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

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-purple-500/10 rounded-lg border border-yellow-500/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div>
              <p className="text-xs text-muted-foreground">Max Win (777)</p>
              <p className="text-lg font-semibold flex items-center text-yellow-400">
                <Coins className="w-4 h-4 mr-1" />
                <CountingNumber value={potentialWin} decimals={8} />
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Multiplier</p>
              <p className="text-lg font-semibold flex items-center text-green-500">
                <Flame className="w-4 h-4 mr-1" />
                {lastWon && winMultiplier > 0 ? (
                  <PulseNumber value={winMultiplier} decimals={2} />
                ) : (
                  '0.00'
                )}x
              </p>
            </div>
          </motion.div>

          {/* Spin Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full relative overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-lg"
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
                      <Cherry className="w-5 h-5" />
                    </motion.div>
                    SPINNING...
                  </>
                ) : (
                  <>
                    <Cherry className="w-5 h-5" />
                    SPIN TO WIN
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
