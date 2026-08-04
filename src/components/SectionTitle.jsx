import React from 'react';

export function SectionTitle({ children, sub }) {
  return (
    <div className="mb-4">
      <h2 className="font-display font-bold text-xl" style={{ color: '#3d2c35' }}>{children}</h2>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}