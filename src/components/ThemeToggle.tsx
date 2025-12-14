import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function ThemeToggle() {
	const [isDark, setIsDark] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const savedTheme = localStorage.getItem('casino-theme') || 'dark';
		const isDarkMode = savedTheme === 'dark';
		setIsDark(isDarkMode);
		applyTheme(isDarkMode);
	}, []);

	const applyTheme = (dark: boolean) => {
		const root = document.documentElement;
		if (dark) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	};

	const toggleTheme = () => {
		const newDarkMode = !isDark;
		setIsDark(newDarkMode);
		applyTheme(newDarkMode);
		localStorage.setItem('casino-theme', newDarkMode ? 'dark' : 'light');
	};

	if (!mounted) return null;

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3 }}
		>
			<Button
				variant="ghost"
				size="icon"
				onClick={toggleTheme}
				className="relative w-10 h-10 rounded-full hover:bg-primary/10 transition-colors"
				aria-label="Toggle theme"
			>
				<motion.div
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					exit={{ scale: 0, rotate: 180 }}
					transition={{ duration: 0.3 }}
				>
					{isDark ? (
						<Moon className="w-5 h-5 text-amber-400" />
					) : (
						<Sun className="w-5 h-5 text-amber-500" />
					)}
				</motion.div>
			</Button>
		</motion.div>
	);
}
