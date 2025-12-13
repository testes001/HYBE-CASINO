import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins } from 'lucide-react';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  onDeposit: (amount: string) => void;
  isDepositing: boolean;
}

export function DepositDialog({
  open,
  onOpenChange,
  currency,
  onDeposit,
  isDepositing,
}: DepositDialogProps) {
  const [amount, setAmount] = useState('1.0');

  const handleDeposit = () => {
    if (parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    onDeposit(amount);
    setAmount('1.0');
  };

  const presetAmounts = ['0.1', '0.5', '1.0', '5.0'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Deposit {currency}
          </DialogTitle>
          <DialogDescription>
            Add funds to your wallet. This is a demo - funds are added instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.1"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map(preset => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => setAmount(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={handleDeposit}
            disabled={isDepositing}
          >
            {isDepositing ? 'Processing...' : `Deposit ${amount} ${currency}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
