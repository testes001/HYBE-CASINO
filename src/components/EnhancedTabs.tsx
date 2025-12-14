import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ReactNode } from 'react';

interface EnhancedTabsProps {
	value: string;
	onValueChange: (value: string) => void;
	tabs: Array<{
		value: string;
		icon: ReactNode;
		label: string;
		content: ReactNode;
	}>;
	className?: string;
}

export function EnhancedTabs({
	value,
	onValueChange,
	tabs,
	className,
}: EnhancedTabsProps) {
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.05,
				delayChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 10 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.3,
				ease: 'easeOut',
			},
		},
	};

	return (
		<Tabs value={value} onValueChange={onValueChange} className={`space-y-6 ${className || ''}`}>
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				<TabsList className="grid w-full grid-cols-10 gap-1">
					{tabs.map((tab, index) => (
						<motion.div key={tab.value} variants={itemVariants}>
							<TabsTrigger value={tab.value} className="text-xs group relative">
								<span className="flex items-center gap-1 relative z-10">
									{tab.icon}
									{tab.label}
								</span>
								{value === tab.value && (
									<motion.div
										layoutId="activeTab"
										className="absolute inset-0 bg-primary/10 rounded-md"
										transition={{
											type: 'spring',
											stiffness: 500,
											damping: 30,
										}}
									/>
								)}
							</TabsTrigger>
						</motion.div>
					))}
				</TabsList>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: 'easeOut' }}
			>
				{tabs.map((tab) => (
					<TabsContent key={tab.value} value={tab.value}>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.3 }}
						>
							{tab.content}
						</motion.div>
					</TabsContent>
				))}
			</motion.div>
		</Tabs>
	);
}
