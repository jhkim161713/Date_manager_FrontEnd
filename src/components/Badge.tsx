import React from 'react';

interface BadgeProps{
    children: React.ReactNode;
    color?: string;
    bg?: string;
}

export function Badge({ children, color = '#ff6b8a', bg = '#fff0f3' }: BadgeProps) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color, background: bg }}>
      {children}
    </span>
  );
}