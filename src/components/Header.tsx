
"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { WeightTracker } from './WeightTracker';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
  onCatClick: () => void;
  isMenuOpen: boolean;
  onPositionChange: (position: { top: number; right: number }) => void;
}

export function Header({ onMenuToggle, onCatClick, isMenuOpen, onPositionChange }: HeaderProps) {
  const { user, username } = useAuth();
  const [frame, setFrame] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const tailFrames = ['ノ', '_ヽ', '__'];
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sequence = [
      { frame: 1, delay: 200 }, // to _ヽ
      { frame: 2, delay: 200 }, // to __
      { frame: 0, delay: 3000 }, // to ノ (after pause)
    ];

    const currentStep = sequence[frame];

    const timeoutId = setTimeout(() => {
      setFrame((prevFrame) => (prevFrame + 1) % sequence.length);
    }, currentStep.delay);

    return () => clearTimeout(timeoutId);
  }, [frame]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isMenuOpen && hamburgerRef.current) {
      const rect = hamburgerRef.current.getBoundingClientRect();
      onPositionChange({ top: rect.top, right: rect.right });
    }
  }, [isMenuOpen, onPositionChange]);

  const tail = tailFrames[frame];

  return (
    <header className="z-30 mb-0 flex items-center relative p-2 md:p-4">
      {/* Left side - cat + user data */}
      <div className="flex items-center gap-4 flex-shrink-0 min-w-0">
        <div
          onClick={onCatClick}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCatClick(); }}
          aria-label="toggle rest timer"
        >
          <pre className="text-muted-foreground text-xs leading-tight select-none">
{`  l、
（ﾟ､ ｡ ７
  l  ~ヽ
  じしf_,)${tail}`}
          </pre>
        </div>

        {user && (
          <div className="flex flex-col items-start gap-1 glitch-text-container min-w-0">
            <div className="flex items-baseline justify-between w-full min-w-0">
              <div className="text-primary font-medium text-sm lowercase truncate">
                {username}
              </div>
              <div className="text-muted-foreground text-[10px] font-mono flex-shrink-0 ml-2">
                {currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
            <WeightTracker />
          </div>
        )}
      </div>

      {/* Center - TREINE title with flex-1 to take available space */}
      <h1 className="text-4xl font-headline font-bold text-primary flex-1 text-center mx-4">
        TREINE
      </h1>

      {/* Right side - hamburger menu */}
      <button
        ref={hamburgerRef}
        onClick={onMenuToggle}
        className="p-2 text-primary hover:text-accent transition-all flex-shrink-0 relative z-50"
        aria-label="toggle navigation menu"
      >
        <div className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
    </header>
  );
}
