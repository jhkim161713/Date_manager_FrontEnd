import React from "react";
interface HScrollProps{
    children: React.ReactNode;
}

export function HScroll({ children }: HScrollProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
      {children}
    </div>
  );
}