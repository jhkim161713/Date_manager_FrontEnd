import { Badge } from '../Badge';

export function RecommendationCard({ entry, liked, onSelect, onToggleLike }) {
  const { place, kind } = entry;
  const badgeColor = kind === 'axis' ? entry.axis.color : '#df9235';
  const badgeBg = kind === 'axis' ? `${entry.axis.color}15` : '#fff6e7';
  const badgeLabel = kind === 'axis'
    ? `${entry.axis.koreanLabel} 매칭`
    : `🔥 ${place.genreName ?? '예매율'} ${place.boxOfficeRank}위`;
  const subLabel = place.address
    ? `📍 ${place.address}`
    : (kind === 'axis' ? `${entry.axis.koreanLabel} 성향에 맞는 장소` : '지금 인기 있는 공연이에요');

  return (
    <div onClick={() => onSelect(place.id)}
      className="rounded-3xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform bg-white flex flex-col shadow-sm"
      style={{ border: '1.5px solid #ffd6e0', minHeight: '230px' }}>
      <div className="relative overflow-hidden bg-pink-100 flex-shrink-0" style={{ height: '170px' }}>
        {place.imageUrl ? (
          <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {/* 세부분류 이모지(2026-08-22) - 백엔드 PlaceResponseDto에 emoji 필드 추가,
                없으면(세부분류 미연결 장소) 예전처럼 공연은 🎭, 그 외는 📍로 폴백. */}
            {place.emoji || (kind === 'popular' ? '🎭' : '📍')}
          </div>
        )}
        <div className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          {/* 세부분류 이모지로 표시(2026-08-28) - 예전엔 📍를 대분류 이름 앞에 고정으로 붙였는데,
              위치 표시가 아니라 카테고리 배지라 실제 분류(볼링장/보드게임카페 등)와 안 맞는 아이콘이
              항상 떠서 세부분류 이모지(없으면 📍)로 바꿈. */}
          {place.emoji || '📍'} {place.category}
        </div>
        <button
          type="button"
          onClick={(e) => onToggleLike(e, place.id)}
          className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm transition-transform hover:scale-110"
          style={{ color: liked ? '#e8486b' : '#a9979e' }}
          aria-label={`${place.name} 찜하기`}
        >
          {liked ? '♥' : '♡'}
        </button>
      </div>
      <div className="p-3 flex flex-col justify-center flex-1 text-center">
        <Badge color={badgeColor} bg={badgeBg}>{badgeLabel}</Badge>
        <p className="font-bold text-sm mt-1.5 leading-tight truncate" style={{ color: '#3d2c35' }}>
          {place.name}
        </p>
        <p className="text-[11px] text-stone-400 mt-1 truncate">{subLabel}</p>
      </div>
    </div>
  );
}
