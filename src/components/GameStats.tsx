import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Trophy, BarChart3 } from 'lucide-react';
import type { GameSessionModel } from '@/components/data/orm/orm_game_session';
import { GameSessionStatus } from '@/components/data/orm/orm_game_session';

interface GameStatsProps {
  sessions: GameSessionModel[];
  currency: string;
}

export function GameStats({ sessions, currency }: GameStatsProps) {
  // Calculate statistics
  const totalBets = sessions.length;
  const wins = sessions.filter(s => s.status === GameSessionStatus.WON).length;
  const losses = sessions.filter(s => s.status === GameSessionStatus.LOST).length;
  const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

  // Calculate profit/loss
  const totalWagered = sessions.reduce((sum, s) => sum + parseFloat(s.bet_amount || '0'), 0);
  const totalWon = sessions.reduce((sum, s) => sum + parseFloat(s.win_amount || '0'), 0);
  const profitLoss = totalWon - totalWagered;
  const isProfitable = profitLoss > 0;

  // Biggest win
  const biggestWin = sessions.length > 0
    ? Math.max(...sessions.map(s => parseFloat(s.win_amount || '0')))
    : 0;

  // Current streak
  let currentStreak = 0;
  let streakType: 'win' | 'loss' | null = null;
  for (let i = 0; i < sessions.length; i++) {
    const isWin = sessions[i].status === GameSessionStatus.WON;
    if (i === 0) {
      currentStreak = 1;
      streakType = isWin ? 'win' : 'loss';
    } else {
      const prevIsWin = sessions[i - 1].status === GameSessionStatus.WON;
      if (isWin === prevIsWin) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Game Statistics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Bets */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total Bets</p>
          </div>
          <p className="text-2xl font-bold">{totalBets}</p>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
            <Badge variant={winRate >= 50 ? "default" : "secondary"} className="text-xs">
              {wins}W / {losses}L
            </Badge>
          </div>
        </div>

        {/* Profit/Loss */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            {isProfitable ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <p className="text-xs text-muted-foreground">Profit/Loss</p>
          </div>
          <p className={`text-2xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            {isProfitable ? '+' : ''}{profitLoss.toFixed(8)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {currency}
          </p>
        </div>

        {/* Biggest Win */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-muted-foreground">Biggest Win</p>
          </div>
          <p className="text-2xl font-bold text-yellow-500">
            {biggestWin.toFixed(8)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {currency}
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Total Wagered */}
        <div className="p-3 rounded-lg bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Total Wagered</p>
          <p className="text-lg font-semibold">{totalWagered.toFixed(8)} {currency}</p>
        </div>

        {/* Current Streak */}
        {totalBets > 0 && (
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
            <div className="flex items-center gap-2">
              <p className={`text-lg font-semibold ${streakType === 'win' ? 'text-green-500' : 'text-red-500'}`}>
                {currentStreak} {streakType === 'win' ? 'Wins' : 'Losses'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
