import { useEffect, useRef, useState } from 'react';

export interface SoundEffects {
  playWin: () => void;
  playLose: () => void;
  playSpin: () => void;
  playClick: () => void;
  playTick: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export function useSound(): SoundEffects {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('soundMuted');
    return saved === 'true';
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = volume;

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  const playWin = () => {
    if (isMuted) return;
    // Winning sound: ascending arpeggio
    playTone(523.25, 0.15, 'sine', 0.3); // C5
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.3), 100); // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.3), 200); // G5
    setTimeout(() => playTone(1046.5, 0.3, 'sine', 0.3), 300); // C6
  };

  const playLose = () => {
    if (isMuted) return;
    // Losing sound: descending tone
    playTone(392, 0.2, 'sine', 0.2); // G4
    setTimeout(() => playTone(329.63, 0.3, 'sine', 0.2), 150); // E4
  };

  const playSpin = () => {
    if (isMuted) return;
    // Spinning sound: quick ascending tone
    playTone(220, 0.1, 'square', 0.15);
  };

  const playClick = () => {
    if (isMuted) return;
    // Click sound: short beep
    playTone(800, 0.05, 'square', 0.1);
  };

  const playTick = () => {
    if (isMuted) return;
    // Tick sound: very short beep
    playTone(1200, 0.02, 'square', 0.08);
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const newValue = !prev;
      localStorage.setItem('soundMuted', String(newValue));
      return newValue;
    });
  };

  return {
    playWin,
    playLose,
    playSpin,
    playClick,
    playTick,
    isMuted,
    toggleMute,
  };
}
