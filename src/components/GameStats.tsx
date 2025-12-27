import { useMemo } from 'react';
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
  // Performance optimization:
  // The statistics for the game sessions are calculated and memoized.
  // This prevents re-calculating these complex values on every render,
  // which is crucial when the parent component re-renders for other reasons.
  // The stats are only re-computed when the `sessions` prop actually changes.
  const stats = useMemo(() => {
    const totalBets = sessions.length;
    const wins = sessions.filter(s => s.status === GameSessionStatus.WON).length;
    const losses = sessions.filter(s => s.status === GameSessionStatus.LOST).length;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

    const totalWagered = sessions.reduce((sum, s) => sum + parseFloat(s.bet_amount || '0'), 0);
    const totalWon = sessions.reduce((sum, s) => sum + parseFloat(s.win_amount || '0'), 0);
    const profitLoss = totalWon - totalWagered;
    const isProfitable = profitLoss > 0;

    const biggestWin = sessions.length > 0
      ? Math.max(...sessions.map(s => parseFloat(s.win_amount || '0')))
      : 0;

    return { totalBets, wins, losses, winRate, totalWagered, totalWon, profitLoss, isProfitable, biggestWin };
  }, [sessions]);

  // Performance optimization:
  // The current streak is also memoized as it requires looping through the sessions.
  // This calculation is only re-run when the `sessions` prop changes.
  const streak = useMemo(() => {
    let currentStreak = 0;
    let streakType: 'win' | 'loss' | null = null;
    if (sessions.length > 0) {
      streakType = sessions[0].status === GameSessionStatus.WON ? 'win' : 'loss';
      currentStreak = 1;
      for (let i = 1; i < sessions.length; i++) {
        const currentIsWin = sessions[i].status === GameSessionStatus.WON;
        const streakIsWin = streakType === 'win';
        if (currentIsWin === streakIsWin) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    return { currentStreak, streakType };
  }, [sessions]);


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
          <p className="text-2xl font-bold">{stats.totalBets}</p>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
            <Badge variant={stats.winRate >= 50 ? "default" : "secondary"} className="text-xs">
              {stats.wins}W / {stats.losses}L
            </Badge>
          </div>
        </div>

        {/* Profit/Loss */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            {stats.isProfitable ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <p className="text-xs text-muted-foreground">Profit/Loss</p>
          </div>
          <p className={`text-2xl font-bold ${stats.isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            {stats.isProfitable ? '+' : ''}{stats.profitLoss.toFixed(8)}
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
            {stats.biggestWin.toFixed(8)}
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
          <p className="text-lg font-semibold">{stats.totalWagered.toFixed(8)} {currency}</p>
        </div>

        {/* Current Streak */}
        {stats.totalBets > 0 && (
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
            <div className="flex items-center gap-2">
              <p className={`text-lg font-semibold ${streak.streakType === 'win' ? 'text-green-500' : 'text-red-500'}`}>
                {streak.currentStreak} {streak.streakType === 'win' ? 'Wins' : 'Losses'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
