import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
}

interface ParticleExplosionProps {
  isWin: boolean;
  trigger: number; // Change this to trigger new explosion
  centerX?: number;
  centerY?: number;
}

export function ParticleExplosion({ isWin, trigger, centerX = 50, centerY = 50 }: ParticleExplosionProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    const particleCount = isWin ? 40 : 20;
    const colors = isWin
      ? ['#22c55e', '#16a34a', '#84cc16', '#fbbf24', '#f59e0b']
      : ['#ef4444', '#dc2626', '#f87171', '#fb923c'];

    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: Math.random(),
      x: centerX,
      y: centerY,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      angle: (360 / particleCount) * i + Math.random() * 30,
      velocity: Math.random() * 150 + 100,
    }));

    setParticles(newParticles);

    const timeout = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(timeout);
  }, [trigger, isWin, centerX, centerY]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => {
          const radians = (particle.angle * Math.PI) / 180;
          const finalX = particle.x + Math.cos(radians) * particle.velocity;
          const finalY = particle.y + Math.sin(radians) * particle.velocity;

          return (
            <motion.div
              key={particle.id}
              initial={{
                x: `${particle.x}%`,
                y: `${particle.y}%`,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: `${finalX}%`,
                y: `${finalY}%`,
                opacity: 0,
                scale: 0.2,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="absolute rounded-full"
              style={{
                backgroundColor: particle.color,
                width: particle.size,
                height: particle.size,
                boxShadow: `0 0 10px ${particle.color}`,
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
