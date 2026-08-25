export function StayPlaceCard({ place, liked, expanded, onToggleExpand, onToggleLike }) {
  const hasExtra = place.parkingInfo || (place.amenities && place.amenities.length > 0) || place.waitingStatus;

  return (
    <article
      className="group overflow-hidden rounded-[24px] bg-white transition-all hover:-translate-y-1"
      style={{ border: '1.5px solid #e6dfed', boxShadow: '0 6px 20px rgba(70, 57, 89, 0.07)' }}
    >
      <div className="relative h-48 overflow-hidden bg-violet-50">
        {place.imageUrl ? (
          <img
            src={place.imageUrl}
            alt={place.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {place.emoji || '🌙'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {place.matchScore != null && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold" style={{ color: '#806bb4', backdropFilter: 'blur(6px)' }}>
            ♥ {place.matchScore}% 매칭
          </span>
        )}
        <button
          type="button"
          onClick={() => onToggleLike(place.id)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm transition-transform hover:scale-110"
          style={{ color: liked ? '#806bb4' : '#a79dab' }}
          aria-label={`${place.name} 찜하기`}
        >
          {liked ? '♥' : '♡'}
        </button>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
          <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ background: 'rgba(49,39,58,0.58)', backdropFilter: 'blur(7px)' }}>
            {place.emoji || '🌙'} {place.subCategory || '숙박'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h4 className="truncate text-base font-extrabold" style={{ color: '#403747' }}>{place.name}</h4>
        <p className="mt-1 truncate text-[10px]" style={{ color: '#95899b' }}>📍 {place.address || '주소 정보 없음'}</p>
        {place.priceText && (
          <p className="mt-1 text-[10px] font-bold" style={{ color: '#594c63' }}>{place.priceText}</p>
        )}

        {expanded && (
          <div className="mt-3 space-y-1.5 rounded-xl px-3 py-2.5 text-[10px] leading-5" style={{ background: '#fffaf7', color: '#877982' }}>
            {place.waitingStatus && <p>웨이팅: {place.waitingStatus}{place.waitingTeams ? ` · ${place.waitingTeams}팀 대기` : ''}</p>}
            {place.parkingInfo && <p>주차: {place.parkingInfo}</p>}
            {place.amenities?.length > 0 && <p>편의시설: {place.amenities.join(', ')}</p>}
            {!hasExtra && <p>아직 등록된 추가 정보가 없어요</p>}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-xl py-2.5 text-[11px] font-extrabold transition-colors"
            style={{ background: '#f5f1f8', color: '#75677f', border: '1px solid #e6dfeb' }}
            aria-expanded={expanded}
          >
            {expanded ? '상세 닫기' : '상세 보기'}
          </button>
          {place.bookingUrl ? (
            <a
              href={place.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl py-2.5 text-center text-[11px] font-extrabold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #806bb4, #66a4b7)', boxShadow: '0 5px 14px rgba(103, 91, 153, 0.2)' }}
            >
              예약 링크 ↗
            </a>
          ) : (
            <span
              className="flex items-center justify-center rounded-xl py-2.5 text-center text-[10px] font-bold"
              style={{ background: '#f5f1f8', color: '#a79dab' }}
            >
              예약 링크 준비중
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
