
"use client";

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
  onCatClick: () => void;
  isTimerOpen: boolean;
}

export function Header({ onMenuToggle, onCatClick, isTimerOpen }: HeaderProps) {
  const [frame, setFrame] = useState(0);
  const tailFrames = ['ノ', '_ヽ', '__'];

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

  const tail = tailFrames[frame];

  return (
    <header className={cn(
      "z-30 mb-0 grid grid-cols-3 items-center relative p-2 md:p-4 transition-opacity",
      { 'z-60': isTimerOpen }
    )}>
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
      
      <h1 className={cn(
        "text-4xl font-headline font-bold text-primary justify-self-center transition-opacity",
        { 'opacity-0': isTimerOpen }
      )}>
        TREINE
      </h1>
      
      <button
        onClick={onMenuToggle}
        className={cn(
          "p-2 text-primary hover:text-accent transition-all justify-self-end",
          { 'opacity-0 pointer-events-none': isTimerOpen }
        )}
        aria-label="toggle navigation menu"
      >
        <Menu className="h-8 w-8" />
      </button>
    </header>
  );
}
