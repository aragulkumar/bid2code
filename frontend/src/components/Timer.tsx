import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Timer: React.FC<TimerProps> = ({
  initialSeconds,
  onExpire,
  size = 'md',
  label = 'Time Remaining'
}) => {
  const [seconds, setSeconds] = useState<number>(Math.max(0, initialSeconds));

  useEffect(() => {
    setSeconds(Math.max(0, initialSeconds));
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpire]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLow = seconds <= 60 && seconds > 0;
  const isCritical = seconds <= 15 && seconds > 0;

  const sizeClasses = {
    sm: 'text-sm py-1 px-2.5',
    md: 'text-base py-1.5 px-3.5',
    lg: 'text-2xl py-2 px-5'
  };

  return (
    <div
      className={`inline-flex items-center space-x-2 rounded-xl font-mono font-bold transition-all ${
        sizeClasses[size]
      } ${
        isCritical
          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse glow-rose'
          : isLow
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-amber'
          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
      }`}
    >
      <Clock className={size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'} />
      <div>
        {label && size === 'sm' && <span className="text-[10px] uppercase text-gray-400 mr-1.5">{label}:</span>}
        <span>{formatTime(seconds)}</span>
      </div>
    </div>
  );
};
