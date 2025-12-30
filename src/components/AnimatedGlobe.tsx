
"use client";

import { cn } from '@/lib/utils';

export function AnimatedGlobe() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-2 -2 20 20"
      className="w-[500px] h-[500px] animate-spin-globe opacity-50"
      style={{
        animationDuration: '30s',
      }}
    >
      <path
        d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"
        fill="hsl(var(--primary))"
        fillRule="evenodd"
        stroke="none"
      />
      <path
        d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="0.1"
      />
      <path
        d="M_css_clean | M2 5c6 2.5 6 7.5 0 10M14 5c-6 2.5-6 7.5 0 10M5 2c2.5 6 7.5 6 10 0M5 14c2.5-6 7.5-6 10 0"
        stroke="hsl(var(--primary))"
        strokeWidth="0.1"
        fill="none"
      />
    </svg>
  );
}
