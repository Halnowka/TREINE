"use client";

import * as React from 'react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from '@/lib/utils';

interface QuickSetLoggerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogSet: (reps: number, weight?: number) => void;
  exerciseName: string;
}

const itemHeight = 64; // h-16
const baseRepOptions = Array.from({ length: 50 }, (_, i) => i + 1);
// Render 3 times for a seamless infinite scroll illusion.
const repOptions = [...baseRepOptions, ...baseRepOptions, ...baseRepOptions]; 

export function QuickSetLoggerDialog({ isOpen, onOpenChange, onLogSet, exerciseName }: QuickSetLoggerDialogProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const isJumpingRef = React.useRef(false); // Ref to prevent scroll handler from firing during manual jumps

  const getLocalStorageKey = (name: string) => `treine_last_rep_${name.replace(/\s+/g, '_')}`;

  // This handler is the key. It fires only after the dialog's open animation is complete.
  const handleOpenAutoFocus = (event: Event) => {
    // Prevent the dialog from automatically focusing on the first focusable element.
    event.preventDefault();

    if (scrollerRef.current) {
        const key = getLocalStorageKey(exerciseName);
        // Default to 8 reps if no value is found in local storage.
        const lastRepCount = parseInt(localStorage.getItem(key) || '8', 10);
        
        // Calculate the index in the MIDDLE section of the triplicated array.
        // This ensures there's ample room to scroll up or down.
        const initialIndex = (lastRepCount - 1) + baseRepOptions.length;
        const initialScrollTop = initialIndex * itemHeight;

        // Set the scroll position instantly.
        scrollerRef.current.scrollTop = initialScrollTop;
    }
  };
  
  const handleScroll = () => {
    // If we are programmatically jumping, ignore this scroll event to prevent infinite loops.
    if (isJumpingRef.current) {
      isJumpingRef.current = false;
      return;
    }

    if (!scrollerRef.current) return;
    
    const { scrollTop, scrollHeight } = scrollerRef.current;
    // Use the actual rendered height for more robust calculation
    const sectionHeight = scrollHeight / 3;

    // If scrolled near the top buffer, jump to the corresponding item in the middle section.
    if (scrollTop < sectionHeight) {
      isJumpingRef.current = true; // Mark that we are about to jump
      scrollerRef.current.scrollTop += sectionHeight;
    } 
    // If scrolled near the bottom buffer, jump to the corresponding item in the middle section.
    else if (scrollTop >= sectionHeight * 2) {
      isJumpingRef.current = true; // Mark that we are about to jump
      scrollerRef.current.scrollTop -= sectionHeight;
    }
  };

  const handleRepSelection = (reps: number) => {
    const key = getLocalStorageKey(exerciseName);
    localStorage.setItem(key, reps.toString());
    onLogSet(reps, undefined);
    onOpenChange(false);
  };
  
  const containerHeight = itemHeight * 5; 
  const verticalPadding = (containerHeight - itemHeight) / 2;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center border-none bg-transparent p-0",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
          onEscapeKeyDown={() => onOpenChange(false)}
          onOpenAutoFocus={handleOpenAutoFocus}
        >
          <div className="relative" style={{ height: `${containerHeight}px`, width: '10rem' }}>
            <div className="absolute top-0 left-0 z-10 h-2/5 w-full bg-gradient-to-b from-background to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 z-10 h-2/5 w-full bg-gradient-to-t from-background to-transparent pointer-events-none" />
            
            <div className="absolute top-1/2 left-0 z-0 w-full -translate-y-1/2 bg-primary/20 border-y border-primary" style={{ height: `${itemHeight}px` }}/>

            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory [scroll-snap-stop:always]"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.snap-y::-webkit-scrollbar { display: none; }`}</style>
              
              <div className="relative" style={{ paddingTop: `${verticalPadding}px`, paddingBottom: `${verticalPadding}px` }}>
                {repOptions.map((r, index) => (
                  <div
                    key={`${r}-${index}`}
                    onClick={() => handleRepSelection(r)}
                    className="snap-center flex items-center justify-center text-4xl font-headline text-primary cursor-pointer"
                    style={{ height: `${itemHeight}px` }}
                  >
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
