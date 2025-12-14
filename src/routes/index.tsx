import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createFileRoute } from "@tanstack/react-router";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletConnect } from '@/components/WalletConnect';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DiceGame } from '@/components/DiceGame';
import { SlotsGame } from '@/components/SlotsGame';
import { BalloonGame } from '@/components/BalloonGame';
import { PlinkoGame } from '@/components/PlinkoGame';
import { RouletteGame } from '@/components/RouletteGame';
import { GameHistory } from '@/components/GameHistory';
import { GameStats } from '@/components/GameStats';
import { AutoBet, type AutoBetConfig } from '@/components/AutoBet';
import { FairnessVerification } from '@/components/FairnessVerification';
import { DepositDialog } from '@/components/DepositDialog';
import { SessionLimits } from '@/components/SessionLimits';
import { useWallet, useWalletBalances, useUserWallets, useDeposit } from '@/hooks/useWallet';
import { usePlaceBet, useGameSessions, useInitializeSeeds, useSessionForVerification } from '@/hooks/useGame';
import { createConfetti } from '@/lib/confetti';
import { Dice1, History, Shield, BarChart3, Zap, Cherry, Flame, Circle as CircleIcon, Target } from 'lucide-react';
import { GradientDivider } from '@/components/GradientDivider';

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const { connectedAddress, currentUser, isConnected, connectWallet, disconnectWallet } = useWallet();
	const [selectedCurrency, setSelectedCurrency] = useState('ETH');
	const [depositDialogOpen, setDepositDialogOpen] = useState(false);
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState('dice');
	const [isAutoBetting, setIsAutoBetting] = useState(false);
	const [autoBetConfig, setAutoBetConfig] = useState<AutoBetConfig | null>(null);
	const [autoBetCount, setAutoBetCount] = useState(0);
	const autoBetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const previousSessionCountRef = useRef<number>(0);

	// Queries
	const { data: wallets = [] } = useUserWallets(currentUser?.id || null);
	const { data: currentWallet } = useWalletBalances(currentUser?.id || null, selectedCurrency);
	const { data: gameSessions = [] } = useGameSessions(currentUser?.id || null);
	const { data: verificationData } = useSessionForVerification(selectedSessionId);

	// Mutations
	const placeBetMutation = usePlaceBet();
	const depositMutation = useDeposit();
	const initSeedsMutation = useInitializeSeeds();

	// Initialize server seeds on mount
	useEffect(() => {
		if (isConnected && currentUser) {
			initSeedsMutation.mutate();
		}
	}, [isConnected, currentUser]);

	// Track session changes for notifications
	useEffect(() => {
		if (gameSessions.length > previousSessionCountRef.current && previousSessionCountRef.current > 0) {
			const latestSession = gameSessions[0];
			const isWin = latestSession.status === 2; // WON
			const amount = parseFloat(latestSession.win_amount || '0');

			if (isWin && amount > 0) {
				toast.success('You Won!', {
					description: `+${amount.toFixed(8)} ${selectedCurrency}`,
					duration: 3000,
				});
				createConfetti();
			} else {
				toast.error('You Lost', {
					description: `Better luck next time!`,
					duration: 2000,
				});
			}
		}
		previousSessionCountRef.current = gameSessions.length;
	}, [gameSessions, selectedCurrency]);

	const handlePlaceBet = async (betAmount: string, target: number) => {
		if (!currentUser) {
			toast.error('Wallet not connected', { description: 'Please connect your wallet first' });
			return;
		}

		// Validate bet amount
		const betAmountNum = parseFloat(betAmount);
		if (betAmountNum <= 0 || isNaN(betAmountNum)) {
			toast.error('Invalid bet amount', { description: 'Please enter a valid bet amount' });
			return;
		}

		// Check balance
		const balance = parseFloat(currentWallet?.available_balance || '0');
		if (betAmountNum > balance) {
			toast.error('Insufficient balance', {
				description: `Available: ${balance.toFixed(8)} ${selectedCurrency}`
			});
			return;
		}

		// Generate random client seed
		const clientSeed = Math.random().toString(36).substring(2, 15);

		try {
			await placeBetMutation.mutateAsync({
				userId: currentUser.id,
				betAmount,
				currency: selectedCurrency,
				clientSeed,
				target,
			});
		} catch (error) {
			console.error('Failed to place bet:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to place bet. Please try again.';
			toast.error('Bet failed', { description: errorMessage });
		}
	};

	const handleDeposit = async (amount: string) => {
		if (!currentUser) return;

		try {
			await depositMutation.mutateAsync({
				userId: currentUser.id,
				currency: selectedCurrency,
				amount,
			});
			setDepositDialogOpen(false);
			toast.success('Deposit successful', {
				description: `Added ${amount} ${selectedCurrency} to your balance`
			});
		} catch (error) {
			console.error('Failed to deposit:', error);
			toast.error('Deposit failed', { description: 'Please try again.' });
		}
	};

	const handleStartAutoBet = (config: AutoBetConfig) => {
		setAutoBetConfig(config);
		setIsAutoBetting(true);
		setAutoBetCount(0);
		toast.info('Auto-bet started', {
			description: `Running ${config.numberOfBets} bets`
		});
	};

	const handleStopAutoBet = () => {
		setIsAutoBetting(false);
		setAutoBetConfig(null);
		if (autoBetTimeoutRef.current) {
			clearTimeout(autoBetTimeoutRef.current);
		}
		toast.info('Auto-bet stopped', {
			description: `Completed ${autoBetCount} bets`
		});
	};

	// Auto-bet logic
	useEffect(() => {
		if (!isAutoBetting || !autoBetConfig || placeBetMutation.isPending) return;

		// Check if we should continue
		if (autoBetCount >= autoBetConfig.numberOfBets) {
			handleStopAutoBet();
			return;
		}

		// Check stop conditions
		if (gameSessions.length > 0 && autoBetCount > 0) {
			const lastSession = gameSessions[0];
			const isWin = lastSession.status === 2;
			const winAmount = parseFloat(lastSession.win_amount || '0');
			const betAmount = parseFloat(lastSession.bet_amount || '0');
			const profit = winAmount - betAmount;

			if (autoBetConfig.stopOnWin && isWin) {
				if (!autoBetConfig.stopOnWinAmount || winAmount >= autoBetConfig.stopOnWinAmount) {
					handleStopAutoBet();
					return;
				}
			}

			if (autoBetConfig.stopOnLoss && !isWin) {
				if (!autoBetConfig.stopOnLossAmount || Math.abs(profit) >= autoBetConfig.stopOnLossAmount) {
					handleStopAutoBet();
					return;
				}
			}
		}

		// Calculate bet amount with progressive betting
		let currentBetAmount = parseFloat(autoBetConfig.baseBetAmount);

		if (gameSessions.length > 0 && autoBetCount > 0) {
			const lastSession = gameSessions[0];
			const isWin = lastSession.status === 2;

			if (autoBetConfig.increaseOnWin && isWin) {
				currentBetAmount *= (1 + autoBetConfig.increasePercentage / 100);
			}

			if (autoBetConfig.increaseOnLoss && !isWin) {
				currentBetAmount *= (1 + autoBetConfig.increasePercentage / 100);
			}
		}

		// Execute next bet after a short delay
		autoBetTimeoutRef.current = setTimeout(async () => {
			try {
				await handlePlaceBet(currentBetAmount.toString(), autoBetConfig.target);
				setAutoBetCount(prev => prev + 1);
			} catch (error) {
				console.error('Auto-bet failed:', error);
				handleStopAutoBet();
			}
		}, 500); // 500ms delay between bets for better UX

		return () => {
			if (autoBetTimeoutRef.current) {
				clearTimeout(autoBetTimeoutRef.current);
			}
		};
	}, [isAutoBetting, autoBetConfig, autoBetCount, gameSessions, placeBetMutation.isPending]);

	const handleVerifySession = (sessionId: string) => {
		setSelectedSessionId(sessionId);
		setActiveTab('verify');
	};

	const lastSession = gameSessions[0];

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto p-6 max-w-7xl">
				{/* Header */}
				<motion.div
					className="mb-8"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-3">
							<motion.div
								animate={{
									rotate: [0, 360],
									scale: [1, 1.1, 1],
								}}
								transition={{
									rotate: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: 'linear' },
									scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse' },
								}}
							>
								<Dice1 className="w-8 h-8 text-primary" />
							</motion.div>
							<h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
								Provably Fair Casino
							</h1>
						</div>
						<ThemeToggle />
					</div>
					<p className="text-muted-foreground">
						Transparent, verifiable, blockchain-powered gaming with multiple games
					</p>
				</motion.div>

				{/* Wallet Connection */}
				<motion.div
					className="mb-6"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4, delay: 0.1 }}
				>
					<WalletConnect
						isConnected={isConnected}
						connectedAddress={connectedAddress}
						onConnect={connectWallet}
						onDisconnect={disconnectWallet}
					/>
				</motion.div>

				<AnimatePresence mode="wait">
					{!isConnected ? (
						<motion.div
							key="not-connected"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.4 }}
							className="text-center py-12"
						>
							<motion.div
								animate={{
									y: [0, -10, 0],
									rotate: [0, 5, -5, 0],
								}}
								transition={{
									duration: 3,
									repeat: Number.POSITIVE_INFINITY,
									repeatType: 'reverse',
								}}
							>
								<Dice1 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
							</motion.div>
							<motion.p
								className="text-xl text-muted-foreground mb-2"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.2 }}
							>
								Connect your wallet to start playing
							</motion.p>
							<motion.p
								className="text-sm text-muted-foreground"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.3 }}
							>
								Experience provably fair gaming with cryptographic verification
							</motion.p>
						</motion.div>
					) : (
						<motion.div
							key="connected"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5 }}
						>
							{/* Balance */}
							<motion.div
								className="mb-6"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: 0.2 }}
							>
								<BalanceDisplay
									wallets={wallets}
									selectedCurrency={selectedCurrency}
									onCurrencyChange={setSelectedCurrency}
									onDeposit={() => setDepositDialogOpen(true)}
								/>
							</motion.div>

							{/* Main Content */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: 0.3 }}
							>
								<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
									<TabsList className="grid w-full grid-cols-10 gap-1">
								<TabsTrigger value="dice" className="text-xs">
									<Dice1 className="w-4 h-4 mr-1" />
									Dice
								</TabsTrigger>
								<TabsTrigger value="slots" className="text-xs">
									<Cherry className="w-4 h-4 mr-1" />
									Slots
								</TabsTrigger>
								<TabsTrigger value="balloon" className="text-xs">
									<Flame className="w-4 h-4 mr-1" />
									Balloon
								</TabsTrigger>
								<TabsTrigger value="plinko" className="text-xs">
									<CircleIcon className="w-4 h-4 mr-1" />
									Plinko
								</TabsTrigger>
								<TabsTrigger value="roulette" className="text-xs">
									<Target className="w-4 h-4 mr-1" />
									Roulette
								</TabsTrigger>
								<TabsTrigger value="auto" className="text-xs">
									<Zap className="w-4 h-4 mr-1" />
									Auto
								</TabsTrigger>
								<TabsTrigger value="stats" className="text-xs">
									<BarChart3 className="w-4 h-4 mr-1" />
									Stats
								</TabsTrigger>
								<TabsTrigger value="history" className="text-xs">
									<History className="w-4 h-4 mr-1" />
									History
								</TabsTrigger>
								<TabsTrigger value="verify" className="text-xs">
									<Shield className="w-4 h-4 mr-1" />
									Verify
								</TabsTrigger>
								<TabsTrigger value="limits" className="text-xs">
									<Shield className="w-4 h-4 mr-1" />
									Limits
								</TabsTrigger>
							</TabsList>

							<TabsContent value="dice">
								<DiceGame
									onPlaceBet={handlePlaceBet}
									isPlaying={placeBetMutation.isPending || isAutoBetting}
									currentBalance={parseFloat(currentWallet?.available_balance || '0')}
									lastOutcome={lastSession?.outcome}
									lastWon={lastSession?.status === 2}
								/>
							</TabsContent>

							<TabsContent value="slots">
								<SlotsGame
									onPlaceBet={handlePlaceBet}
									isPlaying={placeBetMutation.isPending || isAutoBetting}
									currentBalance={parseFloat(currentWallet?.available_balance || '0')}
									lastOutcome={lastSession?.outcome}
									lastWon={lastSession?.status === 2}
								/>
							</TabsContent>

							<TabsContent value="balloon">
								<BalloonGame
									onPlaceBet={handlePlaceBet}
									isPlaying={placeBetMutation.isPending || isAutoBetting}
									currentBalance={parseFloat(currentWallet?.available_balance || '0')}
									lastOutcome={lastSession?.outcome}
									lastWon={lastSession?.status === 2}
								/>
							</TabsContent>

							<TabsContent value="plinko">
								<PlinkoGame
									onPlaceBet={handlePlaceBet}
									isPlaying={placeBetMutation.isPending || isAutoBetting}
									currentBalance={parseFloat(currentWallet?.available_balance || '0')}
									lastOutcome={lastSession?.outcome}
									lastWon={lastSession?.status === 2}
								/>
							</TabsContent>

							<TabsContent value="roulette">
								<RouletteGame
									onPlaceBet={handlePlaceBet}
									isPlaying={placeBetMutation.isPending || isAutoBetting}
									currentBalance={parseFloat(currentWallet?.available_balance || '0')}
									lastOutcome={lastSession?.outcome}
									lastWon={lastSession?.status === 2}
								/>
							</TabsContent>

							<TabsContent value="auto">
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<DiceGame
										onPlaceBet={handlePlaceBet}
										isPlaying={placeBetMutation.isPending || isAutoBetting}
										currentBalance={parseFloat(currentWallet?.available_balance || '0')}
										lastOutcome={lastSession?.outcome}
										lastWon={lastSession?.status === 2}
									/>
									<AutoBet
										onStart={handleStartAutoBet}
										onStop={handleStopAutoBet}
										isRunning={isAutoBetting}
										currentBalance={parseFloat(currentWallet?.available_balance || '0')}
										currentBetCount={autoBetCount}
										totalBets={autoBetConfig?.numberOfBets || 0}
									/>
								</div>
							</TabsContent>

							<TabsContent value="stats">
								<GameStats
									sessions={gameSessions}
									currency={selectedCurrency}
								/>
							</TabsContent>

							<TabsContent value="history">
								<GameHistory
									sessions={gameSessions}
									onVerify={handleVerifySession}
								/>
							</TabsContent>

							<TabsContent value="verify">
								<FairnessVerification
									sessionId={selectedSessionId || undefined}
									serverSeed={verificationData?.serverSeed.seed_value}
									clientSeed={verificationData?.session.client_seed}
									nonce={verificationData?.session.nonce}
									expectedOutcome={verificationData?.session.outcome || undefined}
								/>
							</TabsContent>

							<TabsContent value="limits">
								<SessionLimits />
							</TabsContent>
								</Tabs>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Deposit Dialog */}
				<DepositDialog
					open={depositDialogOpen}
					onOpenChange={setDepositDialogOpen}
					currency={selectedCurrency}
					onDeposit={handleDeposit}
					isDepositing={depositMutation.isPending}
				/>
			</div>
		</div>
	);
}
