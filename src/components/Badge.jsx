import React from 'react';

export function Badge({ children, color = '#ff6b8a', bg = '#fff0f3' }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color, background: bg }}>
      {children}
    </span>
  );
}