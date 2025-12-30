
"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
  onCatClick: () => void;
  isMenuOpen: boolean;
  onPositionChange: (position: { top: number; right: number }) => void;
}

export function Header({ onMenuToggle, onCatClick, isMenuOpen, onPositionChange }: HeaderProps) {
  const [frame, setFrame] = useState(0);
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
    if (isMenuOpen && hamburgerRef.current) {
      const rect = hamburgerRef.current.getBoundingClientRect();
      onPositionChange({ top: rect.top, right: rect.right });
    }
  }, [isMenuOpen, onPositionChange]);

  const tail = tailFrames[frame];

  return (
    <header className="z-30 mb-0 grid grid-cols-3 items-center relative p-2 md:p-4">
      <div 
        onClick={onCatClick} 
        className="justify-self-start cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
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
      
      <h1 className="text-4xl font-headline font-bold text-primary justify-self-center">
        TREINE
      </h1>
      
      <button
        ref={hamburgerRef}
        onClick={onMenuToggle}
        className="p-2 text-primary hover:text-accent transition-all justify-self-end relative z-50"
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
