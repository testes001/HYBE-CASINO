import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SessionLimitsProps {
	onLimitReached?: () => void;
}

export function SessionLimits({ onLimitReached }: SessionLimitsProps) {
	const [limitsEnabled, setLimitsEnabled] = useState(false);
	const [maxLoss, setMaxLoss] = useState('');
	const [maxWager, setMaxWager] = useState('');
	const [sessionTime, setSessionTime] = useState('');
	const [sessionStart] = useState(Date.now());
	const [currentLoss, setCurrentLoss] = useState(0);
	const [currentWager, setCurrentWager] = useState(0);

	useEffect(() => {
		if (!limitsEnabled) return;

		// Check time limit
		if (sessionTime) {
			const timeLimit = parseInt(sessionTime) * 60 * 1000; // Convert minutes to ms
			const elapsed = Date.now() - sessionStart;

			if (elapsed >= timeLimit) {
				toast.warning('Session time limit reached', {
					description: 'You have reached your session time limit. Please take a break.',
				});
				onLimitReached?.();
			}
		}

		// Check loss limit
		if (maxLoss && currentLoss >= parseFloat(maxLoss)) {
			toast.warning('Loss limit reached', {
				description: 'You have reached your loss limit. Please take a break.',
			});
			onLimitReached?.();
		}

		// Check wager limit
		if (maxWager && currentWager >= parseFloat(maxWager)) {
			toast.warning('Wager limit reached', {
				description: 'You have reached your wager limit. Please take a break.',
			});
			onLimitReached?.();
		}
	}, [limitsEnabled, currentLoss, currentWager, sessionTime, maxLoss, maxWager, sessionStart, onLimitReached]);

	const handleSaveLimits = () => {
		setLimitsEnabled(true);
		toast.success('Session limits activated', {
			description: 'Your responsible gaming limits have been set.',
		});
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Shield className="w-5 h-5 text-primary" />
					<CardTitle>Responsible Gaming</CardTitle>
				</div>
				<CardDescription>
					Set limits to help you play responsibly
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between">
					<Label htmlFor="limits-toggle" className="flex flex-col gap-1">
						<span>Enable Session Limits</span>
						<span className="text-xs text-muted-foreground font-normal">
							Activate responsible gaming controls
						</span>
					</Label>
					<Switch
						id="limits-toggle"
						checked={limitsEnabled}
						onCheckedChange={setLimitsEnabled}
					/>
				</div>

				{limitsEnabled && (
					<>
						<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
							<AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
							<p className="text-sm text-amber-700 dark:text-amber-400">
								Once limits are reached, you will be notified to take a break from gaming.
							</p>
						</div>

						<div className="space-y-3">
							<div className="space-y-2">
								<Label htmlFor="max-loss">Max Loss Limit</Label>
								<Input
									id="max-loss"
									type="number"
									step="0.00000001"
									placeholder="0.00000000"
									value={maxLoss}
									onChange={(e) => setMaxLoss(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Maximum amount you can lose in this session
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="max-wager">Max Wager Limit</Label>
								<Input
									id="max-wager"
									type="number"
									step="0.00000001"
									placeholder="0.00000000"
									value={maxWager}
									onChange={(e) => setMaxWager(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Maximum total amount you can wager in this session
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="session-time">Session Time Limit (minutes)</Label>
								<Input
									id="session-time"
									type="number"
									placeholder="60"
									value={sessionTime}
									onChange={(e) => setSessionTime(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Maximum time for this gaming session
								</p>
							</div>

							<Button onClick={handleSaveLimits} className="w-full">
								Save Limits
							</Button>
						</div>
					</>
				)}

				{limitsEnabled && (
					<div className="space-y-2 pt-4 border-t">
						<h4 className="text-sm font-medium">Current Session</h4>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-muted-foreground">Total Loss</p>
								<p className="font-mono">{currentLoss.toFixed(8)}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Total Wagered</p>
								<p className="font-mono">{currentWager.toFixed(8)}</p>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
