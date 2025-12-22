import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle2, XCircle, Filter, Download } from 'lucide-react';
import type { GameSessionModel } from '@/components/data/orm/orm_game_session';
import { GameSessionStatus } from '@/components/data/orm/orm_game_session';

interface GameHistoryProps {
  sessions: GameSessionModel[];
  onVerify: (sessionId: string) => void;
}

export function GameHistory({ sessions, onVerify }: GameHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  const formatAmount = (amount: string) => {
    if (!amount) return '0.00000000';
    return parseFloat(amount).toFixed(8);
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Bet Amount', 'Outcome', 'Target', 'Win Amount', 'Status', 'Nonce'];
    const rows = filteredSessions.map(session => {
      const gameData = session.game_data ? JSON.parse(session.game_data) : {};
      return [
        formatTimestamp(session.create_time),
        formatAmount(session.bet_amount),
        session.outcome?.toFixed(2) || 'N/A',
        gameData.target?.toFixed(2) || 'N/A',
        formatAmount(session.win_amount),
        session.status === GameSessionStatus.WON ? 'Won' : 'Lost',
        session.nonce.toString(),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Memoize filtered sessions to prevent expensive re-calculations on every render.
  // This is especially important when the list of sessions is large.
  const filteredSessions = useMemo(() => sessions.filter(session => {
    const isWin = session.status === GameSessionStatus.WON;
    const matchesFilter = filter === 'all' || (filter === 'wins' ? isWin : !isWin);
    const matchesSearch = searchTerm === '' ||
      session.outcome?.toString().includes(searchTerm) ||
      session.bet_amount.includes(searchTerm) ||
      session.nonce.toString().includes(searchTerm);

    return matchesFilter && matchesSearch;
  }), [sessions, filter, searchTerm]);

  return (
    <Card className="relative p-6 overflow-hidden backdrop-blur-sm bg-card/95 border-2">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <motion.div
        className="flex items-center justify-between mb-4 relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          >
            <History className="w-5 h-5 text-primary" />
          </motion.div>
          <h3 className="text-lg font-semibold">Game History</h3>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.2 }}
          >
            <Badge variant="secondary">{filteredSessions.length}</Badge>
          </motion.div>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredSessions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            <Filter className="w-4 h-4 mr-1" />
            All
          </Button>
          <Button
            variant={filter === 'wins' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('wins')}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Wins
          </Button>
          <Button
            variant={filter === 'losses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('losses')}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Losses
          </Button>
        </div>

        <Input
          placeholder="Search by outcome, bet amount, or nonce..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No games played yet</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No matches found</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] relative">
          <AnimatePresence mode="popLayout">
            <motion.div className="space-y-3">
              {filteredSessions.map((session, index) => {
                const isWin = session.status === GameSessionStatus.WON;
                const gameData = session.game_data ? JSON.parse(session.game_data) : {};

                return (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: isWin
                        ? '0 8px 20px rgba(34, 197, 94, 0.15)'
                        : '0 8px 20px rgba(239, 68, 68, 0.15)',
                    }}
                    className={`p-4 rounded-lg border-2 ${
                      isWin
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                        >
                          {isWin ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </motion.div>
                        <span className="font-semibold">
                          {isWin ? 'Won' : 'Lost'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(session.create_time)}
                      </span>
                    </div>

                    <motion.div
                      className="grid grid-cols-2 gap-2 text-sm mb-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                    >
                      <div>
                        <p className="text-muted-foreground">Bet Amount</p>
                        <p className="font-medium">
                          {formatAmount(session.bet_amount)} {session.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Outcome</p>
                        <p className="font-medium">
                          {session.outcome?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target</p>
                        <p className="font-medium">{gameData.target?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Win Amount</p>
                        <p className={`font-medium ${isWin ? 'text-green-500' : ''}`}>
                          {formatAmount(session.win_amount)} {session.currency}
                        </p>
                      </div>
                    </motion.div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        <span>Nonce: {session.nonce}</span>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onVerify(session.id)}
                        >
                          Verify Fairness
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      )}
    </Card>
  );
}
