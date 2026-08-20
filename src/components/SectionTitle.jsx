import React from 'react';

export function SectionTitle({ children, sub, titleSize = 'text-xl', subSize = 'text-xs' }) {
  return (
    <div className="mb-4">
      <h2 className={`font-display font-bold ${titleSize}`} style={{ color: '#3d2c35' }}>{children}</h2>
      {sub && <p className={`${subSize} text-stone-400 mt-0.5`}>{sub}</p>}
    </div>
  );
}