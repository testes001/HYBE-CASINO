import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap, StopCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AutoBetProps {
  onStart: (config: AutoBetConfig) => void;
  onStop: () => void;
  isRunning: boolean;
  currentBalance: number;
  currentBetCount?: number;
  totalBets?: number;
}

export interface AutoBetConfig {
  numberOfBets: number;
  baseBetAmount: string;
  target: number;
  stopOnWin: boolean;
  stopOnLoss: boolean;
  stopOnWinAmount?: number;
  stopOnLossAmount?: number;
  increaseOnWin: boolean;
  increaseOnLoss: boolean;
  increasePercentage: number;
}

export function AutoBet({ onStart, onStop, isRunning, currentBalance, currentBetCount = 0, totalBets = 0 }: AutoBetProps) {
  const [config, setConfig] = useState<AutoBetConfig>({
    numberOfBets: 10,
    baseBetAmount: '0.001',
    target: 50,
    stopOnWin: false,
    stopOnLoss: false,
    increaseOnWin: false,
    increaseOnLoss: false,
    increasePercentage: 100,
  });

  const handleStart = () => {
    if (config.numberOfBets <= 0) {
      alert('Number of bets must be greater than 0');
      return;
    }
    onStart(config);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Auto Bet</h3>
      </div>

      <div className="space-y-4">
        {/* Bet Amount */}
        <div>
          <Label htmlFor="baseBetAmount">Bet Amount</Label>
          <Input
            id="baseBetAmount"
            type="number"
            step="0.001"
            min="0.001"
            value={config.baseBetAmount}
            onChange={e => setConfig({ ...config, baseBetAmount: e.target.value })}
            disabled={isRunning}
          />
        </div>

        {/* Target */}
        <div>
          <Label htmlFor="target">Roll Under (Target)</Label>
          <Input
            id="target"
            type="number"
            min="1"
            max="99"
            step="0.01"
            value={config.target}
            onChange={e => setConfig({ ...config, target: parseFloat(e.target.value) || 50 })}
            disabled={isRunning}
          />
        </div>

        {/* Number of Bets */}
        <div>
          <Label htmlFor="numberOfBets">Number of Bets</Label>
          <Input
            id="numberOfBets"
            type="number"
            min="1"
            max="1000"
            value={config.numberOfBets}
            onChange={e => setConfig({ ...config, numberOfBets: parseInt(e.target.value) || 0 })}
            disabled={isRunning}
          />
        </div>

        {/* Stop on Win */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="stopOnWin">Stop on Win</Label>
            <p className="text-xs text-muted-foreground">Stop after winning a bet</p>
          </div>
          <Switch
            id="stopOnWin"
            checked={config.stopOnWin}
            onCheckedChange={checked => setConfig({ ...config, stopOnWin: checked })}
            disabled={isRunning}
          />
        </div>

        {config.stopOnWin && (
          <div>
            <Label htmlFor="stopOnWinAmount">Stop on Win Amount (optional)</Label>
            <Input
              id="stopOnWinAmount"
              type="number"
              step="0.001"
              placeholder="e.g., 0.1"
              value={config.stopOnWinAmount || ''}
              onChange={e => setConfig({
                ...config,
                stopOnWinAmount: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              disabled={isRunning}
            />
          </div>
        )}

        {/* Stop on Loss */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="stopOnLoss">Stop on Loss</Label>
            <p className="text-xs text-muted-foreground">Stop after losing a bet</p>
          </div>
          <Switch
            id="stopOnLoss"
            checked={config.stopOnLoss}
            onCheckedChange={checked => setConfig({ ...config, stopOnLoss: checked })}
            disabled={isRunning}
          />
        </div>

        {config.stopOnLoss && (
          <div>
            <Label htmlFor="stopOnLossAmount">Stop on Loss Amount (optional)</Label>
            <Input
              id="stopOnLossAmount"
              type="number"
              step="0.001"
              placeholder="e.g., 0.05"
              value={config.stopOnLossAmount || ''}
              onChange={e => setConfig({
                ...config,
                stopOnLossAmount: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              disabled={isRunning}
            />
          </div>
        )}

        {/* Increase on Win */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="increaseOnWin">Increase on Win</Label>
            <p className="text-xs text-muted-foreground">Double bet after win</p>
          </div>
          <Switch
            id="increaseOnWin"
            checked={config.increaseOnWin}
            onCheckedChange={checked => setConfig({ ...config, increaseOnWin: checked })}
            disabled={isRunning}
          />
        </div>

        {/* Increase on Loss (Martingale) */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="increaseOnLoss">Increase on Loss</Label>
            <p className="text-xs text-muted-foreground">Martingale strategy</p>
          </div>
          <Switch
            id="increaseOnLoss"
            checked={config.increaseOnLoss}
            onCheckedChange={checked => setConfig({ ...config, increaseOnLoss: checked })}
            disabled={isRunning}
          />
        </div>

        {/* Progress Indicator */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{currentBetCount} / {totalBets}</span>
            </div>
            <Progress value={(currentBetCount / totalBets) * 100} />
          </div>
        )}

        {/* Control Buttons */}
        {!isRunning ? (
          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Auto Bet
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            variant="destructive"
            onClick={onStop}
          >
            <StopCircle className="w-4 h-4 mr-2" />
            Stop Auto Bet
          </Button>
        )}
      </div>
    </Card>
  );
}
