import { motion } from 'framer-motion';

interface GradientDividerProps {
	className?: string;
	animated?: boolean;
}

export function GradientDivider({ className = '', animated = true }: GradientDividerProps) {
	return (
		<motion.div
			className={`h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent ${className}`}
			initial={animated ? { opacity: 0 } : undefined}
			animate={animated ? { opacity: 1 } : undefined}
			transition={{ duration: 0.5 }}
		/>
	);
}
