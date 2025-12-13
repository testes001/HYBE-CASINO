import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Result {
  id: string;
  won: boolean;
  multiplier: number;
  timestamp: number;
}

interface RecentResultsProps {
  results: Result[];
  maxDisplay?: number;
}

export function RecentResults({ results, maxDisplay = 10 }: RecentResultsProps) {
  const displayResults = results.slice(0, maxDisplay);
  const wins = results.filter(r => r.won).length;
  const losses = results.length - wins;
  const winRate = results.length > 0 ? (wins / results.length) * 100 : 0;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent Results</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-green-500">
            <TrendingUp className="w-3 h-3" />
            <span>{wins}W</span>
          </div>
          <div className="flex items-center gap-1 text-red-500">
            <TrendingDown className="w-3 h-3" />
            <span>{losses}L</span>
          </div>
          <div className="text-muted-foreground">
            {winRate.toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        <AnimatePresence mode="popLayout">
          {displayResults.map((result) => (
            <motion.div
              key={result.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
                result.won
                  ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                  : 'bg-red-500/20 text-red-500 border border-red-500/50'
              }`}
              title={`${result.won ? 'Win' : 'Loss'} - ${result.multiplier.toFixed(2)}x`}
            >
              {result.multiplier.toFixed(1)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {results.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No games played yet
        </p>
      )}
    </Card>
  );
}
