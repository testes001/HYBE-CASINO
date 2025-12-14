import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import type { WalletModel } from '@/components/data/orm/orm_wallet';
import { CountingNumber } from '@/components/CountingNumber';

interface BalanceDisplayProps {
  wallets: WalletModel[];
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  onDeposit: () => void;
}

export function BalanceDisplay({
  wallets,
  selectedCurrency,
  onCurrencyChange,
  onDeposit,
}: BalanceDisplayProps) {
  const selectedWallet = wallets.find(w => w.currency === selectedCurrency);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [balanceChange, setBalanceChange] = useState<number>(0);
  const [showChange, setShowChange] = useState(false);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(8);
  };

  const currentBalance = selectedWallet ? parseFloat(selectedWallet.available_balance) : 0;

  // Track balance changes
  useEffect(() => {
    if (previousBalance !== null && currentBalance !== previousBalance) {
      const change = currentBalance - previousBalance;
      setBalanceChange(change);
      setShowChange(true);

      // Hide change indicator after 3 seconds
      const timer = setTimeout(() => {
        setShowChange(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
    setPreviousBalance(currentBalance);
  }, [currentBalance, previousBalance]);

  return (
    <Card variant="glass-glow" className="relative p-6 overflow-hidden border-2">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <motion.div
        className="flex items-center justify-between mb-4 relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            >
              <Coins className="w-6 h-6 text-primary" />
            </motion.div>
          </motion.div>
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold">
                <CountingNumber
                  value={currentBalance}
                  decimals={8}
                  duration={0.6}
                />
              </p>
              <AnimatePresence>
                {showChange && balanceChange !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 10 }}
                    className={`flex items-center gap-1 text-sm font-medium ${
                      balanceChange > 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    <motion.div
                      animate={{ y: balanceChange > 0 ? [-2, 0, -2] : [2, 0, 2] }}
                      transition={{ duration: 0.6, repeat: 3 }}
                    >
                      {balanceChange > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </motion.div>
                    <span>
                      {balanceChange > 0 ? '+' : ''}{balanceChange.toFixed(8)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-xs text-muted-foreground">{selectedCurrency}</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={onDeposit} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Deposit
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="flex gap-2 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {wallets.map((wallet, index) => (
          <motion.div
            key={wallet.currency}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={selectedCurrency === wallet.currency ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCurrencyChange(wallet.currency)}
              className="relative overflow-hidden"
            >
              {selectedCurrency === wallet.currency && (
                <motion.div
                  layoutId="activeCurrency"
                  className="absolute inset-0 bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{wallet.currency}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedWallet && (
          <motion.div
            key={selectedCurrency}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm overflow-hidden relative"
          >
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-muted-foreground">Available</p>
              <p className="font-medium">
                <CountingNumber
                  value={parseFloat(selectedWallet.available_balance)}
                  decimals={8}
                  duration={0.5}
                />
              </p>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-muted-foreground">Locked</p>
              <p className="font-medium">
                <CountingNumber
                  value={parseFloat(selectedWallet.locked_balance)}
                  decimals={8}
                  duration={0.5}
                />
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
