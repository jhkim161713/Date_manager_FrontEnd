import React from "react";

export function HScroll({ children }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
      {children}
    </div>
  );
}