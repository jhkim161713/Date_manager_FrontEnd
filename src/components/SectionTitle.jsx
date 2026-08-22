import React from 'react';

export function SectionTitle({ children, sub, titleSize = 'text-2xl', subSize = 'text-sm' }) {
  return (
    <div className="mb-4">
      <h2 className={`font-display font-bold leading-none tracking-tight text-rose-500 ${titleSize}`}>{children}</h2>
      {sub && <p className={`${subSize} text-rose-300 font-medium mt-0.5`}>{sub}</p>}
    </div>
  );
}