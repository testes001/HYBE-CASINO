import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface NotificationEnhancerProps {
	type: 'success' | 'error' | 'info' | 'warning';
	title: string;
	message?: string;
}

export function NotificationEnhancer({
	type,
	title,
	message,
}: NotificationEnhancerProps) {
	const icons = {
		success: CheckCircle,
		error: AlertCircle,
		info: Info,
		warning: AlertTriangle,
	};

	const colors = {
		success: 'from-green-500/20 to-green-500/5 border-green-500/30',
		error: 'from-red-500/20 to-red-500/5 border-red-500/30',
		info: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
		warning: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
	};

	const textColors = {
		success: 'text-green-400',
		error: 'text-red-400',
		info: 'text-blue-400',
		warning: 'text-amber-400',
	};

	const Icon = icons[type];

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 10, scale: 0.9 }}
			transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
			className={`glass-premium bg-gradient-to-r ${colors[type]} border rounded-lg p-4 flex items-start gap-3`}
		>
			<motion.div
				animate={{ rotate: [0, 360] }}
				transition={{
					duration: 2,
					repeat: type === 'warning' ? Number.POSITIVE_INFINITY : 0,
					ease: 'linear',
				}}
				className={`flex-shrink-0 mt-0.5 ${textColors[type]}`}
			>
				<Icon className="w-5 h-5" />
			</motion.div>

			<div className="flex-1 min-w-0">
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.1 }}
					className="font-medium text-sm"
				>
					{title}
				</motion.p>
				{message && (
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.15 }}
						className="text-xs text-muted-foreground mt-1"
					>
						{message}
					</motion.p>
				)}
			</div>

			<motion.div
				initial={{ scaleX: 1 }}
				animate={{ scaleX: 0 }}
				transition={{ duration: 3, ease: 'linear' }}
				className={`absolute bottom-0 left-0 h-1 ${
					type === 'success'
						? 'bg-green-500/60'
						: type === 'error'
							? 'bg-red-500/60'
							: type === 'info'
								? 'bg-blue-500/60'
								: 'bg-amber-500/60'
				}`}
				style={{ width: '100%', transformOrigin: 'left' }}
			/>
		</motion.div>
	);
}
