import { Badge } from './Badge';

export function ContentCard({ item, wide }) {
  return (
    <div className={`rounded-3xl overflow-hidden flex-shrink-0 ${wide ? 'w-72' : 'w-52'} hover:scale-[1.02] transition-transform cursor-pointer`}
      style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
      <div className={`bg-pink-100 overflow-hidden ${wide ? 'h-44' : 'h-32'}`}>
        <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <Badge color={item.tagColor} bg={item.tagBg}>{item.tag}</Badge>
          <span className="text-xs font-bold" style={{ color: '#ff6b8a' }}>♥ {item.match}% 매칭</span>
        </div>
        <p className="font-bold text-sm leading-snug" style={{ color: '#3d2c35' }}>{item.title}</p>
        <p className="text-xs text-stone-400 mt-0.5 truncate">{item.subtitle}</p>
        {item.location && <p className="text-xs text-stone-400 mt-1">📍 {item.location}</p>}
      </div>
    </div>
  )
}