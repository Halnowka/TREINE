
"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import type { TimerType } from '@/types';

interface RestTimerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const timerConfig = {
  'max': { duration: 0, mode: 'stopwatch' as const, label: 'Max Day Rest (5:00+)' },
  'sub-max': { duration: 60, mode: 'countdown' as const, label: 'Sub-Max Rest (1:00)' },
  'ladder': { duration: 30, mode: 'countdown' as const, label: 'Ladder Rest (0:30)' },
};

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function RestTimer({ isOpen, onOpenChange }: RestTimerProps) {
  const [activeTimer, setActiveTimer] = useState<TimerType | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setActiveTimer(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!activeTimer) {
      setSeconds(timerConfig[activeTimer as keyof typeof timerConfig]?.duration || 0);
      return;
    }

    const config = timerConfig[activeTimer];
    setSeconds(config.duration);

    const intervalId = setInterval(() => {
      if (config.mode === 'countdown') {
        setSeconds(prev => {
          if (prev <= 1) {
            onOpenChange(false);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeTimer, onOpenChange]);

  const handleSelectTimer = (type: TimerType) => {
    setActiveTimer(type);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center cursor-pointer"
    >
      <div onClick={(e) => e.stopPropagation()} className="cursor-auto">
        {activeTimer ? (
          <div className="font-headline text-8xl md:text-9xl text-primary select-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(seconds)}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="text-xl h-14 px-8 lowercase" onClick={() => handleSelectTimer('max')}>{timerConfig['max'].label}</Button>
            <Button variant="outline" className="text-xl h-14 px-8 lowercase" onClick={() => handleSelectTimer('sub-max')}>{timerConfig['sub-max'].label}</Button>
            <Button variant="outline" className="text-xl h-14 px-8 lowercase" onClick={() => handleSelectTimer('ladder')}>{timerConfig['ladder'].label}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
