import { Badge } from '../Badge';
import { pickMatchingAxes } from '../../lib/placeMatching';

export function DatePlaceCard({ place, personaProfile, liked, inBuilder, onSelect, onToggleLike, onToggleBuilder, onAddToCalendar }) {
  const tag = place.subCategory || place.parentCategory;
  const matchingAxes = pickMatchingAxes(place, personaProfile);

  return (
    <article
      onClick={() => onSelect(place.id)}
      className="group cursor-pointer overflow-hidden rounded-[24px] bg-white transition-all hover:-translate-y-1"
      style={{ border: '1.5px solid #f0dce2', boxShadow: '0 5px 18px rgba(89, 58, 70, 0.06)' }}
    >
      <div className="relative h-40 overflow-hidden bg-rose-50">
        {place.imageUrl ? (
          <img
            src={place.imageUrl}
            alt={place.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {place.emoji || '📍'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {place.matchScore != null && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold" style={{ color: '#e8486b', backdropFilter: 'blur(6px)' }}>
            ♥ {place.matchScore}% 매칭
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleLike(place.id); }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm transition-transform hover:scale-110"
          style={{ color: liked ? '#e8486b' : '#a9979e' }}
          aria-label={`${place.name} 찜하기`}
        >
          {liked ? '♥' : '♡'}
        </button>
      </div>

      <div className="p-4">
        {/* 성향 매치 배지 - 원본 기획서("스마트 데이트 큐레이션") ①의 "장소 성향과 유저
            성향 비교, 상위 특징 배지" 재현. 매칭%가 없어도(matchScore 파이프라인 미완성)
            "어떤 성향에 왜 맞는지"는 보여줄 수 있어서 큐레이션만의 정보로 남긴다(2026-08-19). */}
        {matchingAxes.length > 0 && (
          <div className="mb-1.5 flex items-center gap-1.5">
            {matchingAxes.map((axis) => (
              <span key={axis.id} className="rounded-full px-2 py-0.5 text-[9px] font-extrabold"
                style={{ background: `${axis.color}18`, color: axis.color, border: `1px solid ${axis.color}55` }}>
                ✨ {axis.koreanLabel}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Badge color="#e8486b" bg="#fff0f3">{place.emoji ? `${place.emoji} ${tag}` : tag}</Badge>
            {place.boxOfficeRank != null && (
              <Badge color="#df9235" bg="#fff6e7">🔥 예매율 {place.boxOfficeRank}위</Badge>
            )}
          </div>
          {place.runtimeText && (
            <span className="text-[9px] font-bold" style={{ color: '#aa969e' }}>{place.runtimeText}</span>
          )}
        </div>
        <h4 className="mt-2.5 truncate text-sm font-extrabold" style={{ color: '#43323a' }}>{place.name}</h4>

        <div className="mt-3 flex items-center justify-between gap-2 text-[10px]">
          <span className="truncate" style={{ color: '#8f7b84' }}>📍 {place.address || '주소 정보 없음'}</span>
        </div>
        {/* 현실 체킹 태그 - 기획서 ②(웨이팅/가격/주차)를 데이트 카드에도 노출(2026-08-19).
            지금까지는 숙박 카드에만 붙어있었음. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {place.priceText && (
            <span className="text-[10px] font-bold" style={{ color: '#66515a' }}>{place.priceText}</span>
          )}
          {place.waitingStatus && (
            <Badge color="#3d9b86" bg="#eaf8f4">
              ⏱ {place.waitingStatus}{place.waitingTeams ? ` · ${place.waitingTeams}팀` : ''}
            </Badge>
          )}
          {place.parkingInfo && (
            <Badge color="#806bb4" bg="#f1edff">🅿 {place.parkingInfo}</Badge>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleBuilder(place); }}
            className="rounded-xl py-2.5 text-[11px] font-extrabold transition-all"
            style={{
              background: inBuilder ? '#f3edef' : '#fff0f3',
              color: inBuilder ? '#846f78' : '#e8486b',
              border: `1px solid ${inBuilder ? '#e8dde1' : '#f6cdd7'}`,
            }}
          >
            {inBuilder ? '✓ 코스 후보에 담김' : '+ 코스 빌더에 담기'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddToCalendar(place); }}
            className="rounded-xl py-2.5 text-[11px] font-extrabold transition-all"
            style={{ background: '#fff8ee', color: '#c98a3d', border: '1px solid #f3ddb8' }}
          >
            📅 캘린더에 담기
          </button>
        </div>
      </div>
    </article>
  );
}
