import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';

interface BetPresetsProps {
	currentBalance: number;
	onSelectPreset: (amount: string) => void;
	disabled?: boolean;
}

export function BetPresets({ currentBalance, onSelectPreset, disabled }: BetPresetsProps) {
	const presets = [
		{ label: '10%', multiplier: 0.1 },
		{ label: '25%', multiplier: 0.25 },
		{ label: '50%', multiplier: 0.5 },
		{ label: 'Max', multiplier: 1.0 },
	];

	const handlePresetClick = (multiplier: number) => {
		const amount = (currentBalance * multiplier).toFixed(8);
		onSelectPreset(amount);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Coins className="w-4 h-4" />
				<span>Quick Bet</span>
			</div>
			<div className="grid grid-cols-4 gap-2">
				{presets.map((preset) => (
					<Button
						key={preset.label}
						variant="outline"
						size="sm"
						onClick={() => handlePresetClick(preset.multiplier)}
						disabled={disabled || currentBalance === 0}
						className="text-xs"
					>
						{preset.label}
					</Button>
				))}
			</div>
		</div>
	);
}
