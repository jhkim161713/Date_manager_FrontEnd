import { useEffect, useState } from 'react';
import { getPlace, getVenuePerformances } from '../lib/api';
import { PERSONA_AXES } from '../data/onboardingData';

// 홈/큐레이션 카드를 클릭하면 뜨는 장소 상세 모달(2026-08-22). 그동안 GET /api/places/{id}를
// 실제로 호출하는 곳이 프론트에 하나도 없어서(백엔드는 "장소 열람" 성향값 갱신 트리거까지
// 만들어놨는데 호출부가 없던 상태), 이 모달이 그 첫 실제 호출부다 - 로그인 유저가 열면
// 자동으로 약한 신호(α=0.02)가 반영된다.
const AXIS_TO_PLACE_SCORE = {
  energetic: 'scoreEnergy',
  immersion: 'scoreImmersion',
  vibe: 'scoreVibe',
  aesthetic: 'scoreAesthetic',
  depth: 'scoreDepth',
};

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export function PlaceDetailModal({ placeId, onClose }) {
  const [place, setPlace] = useState(null);
  const [error, setError] = useState(null);
  // "이 공연장의 다른 공연"을 누르면 모달을 닫지 않고 그 자리에서 갈아끼울 수 있도록, 실제로 보여줄
  // 장소 id를 prop과 분리된 로컬 상태로 둔다(2026-08-27). prop이 바뀌면(다른 카드를 새로 클릭) 이
  // 상태도 그걸 따라간다.
  const [activePlaceId, setActivePlaceId] = useState(placeId);
  const [venuePerformances, setVenuePerformances] = useState([]);
  useEffect(() => { setActivePlaceId(placeId); }, [placeId]);

  useEffect(() => {
    let cancelled = false;
    setPlace(null);
    setError(null);
    setVenuePerformances([]);
    getPlace(activePlaceId)
      .then((data) => { if (!cancelled) setPlace(data); })
      .catch((e) => { if (!cancelled) setError(e.message || '장소 정보를 불러오지 못했어요'); });
    return () => { cancelled = true; };
  }, [activePlaceId]);

  // 장소를 불러온 뒤 공연장 ID나 이름이 있으면("성남아트센터" 같은 장소 자체가 아니라 거기서 하는
  // 다른 공연들, 2026-08-27) 같은 공연장의 다른 공연들을 이어서 불러온다. venueId 없이 venueName만
  // 있는 경우도 많아서(2026-08-28 실측 - venue_name 있는 장소 중 91%가 venue_id는 없음, KOPIS
  // 시설상세조회로 mt10id를 못 딴 경우) venueId만 조건으로 두면 대부분 이 기능이 안 떴다 - 백엔드
  // (getVenuePerformances)는 이미 venueId 없으면 venueName으로 대체 조회하므로 프론트 조건도 맞춘다.
  useEffect(() => {
    if (!place?.venueId && !place?.venueName) return;
    let cancelled = false;
    getVenuePerformances(place.id)
      .then((data) => { if (!cancelled) setVenuePerformances(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setVenuePerformances([]); });
    return () => { cancelled = true; };
  }, [place?.id, place?.venueId, place?.venueName]);

  const hasPerformanceInfo = place && (place.startDate || place.runtimeText || place.priceInfo || place.showTimeInfo);
  const axisEntries = place
    ? PERSONA_AXES
        .filter((axis) => AXIS_TO_PLACE_SCORE[axis.id] && place[AXIS_TO_PLACE_SCORE[axis.id]] != null && place[AXIS_TO_PLACE_SCORE[axis.id]] !== 50)
        .map((axis) => ({ axis, score: place[AXIS_TO_PLACE_SCORE[axis.id]] }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: 'rgba(61,44,53,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-3xl w-full max-w-md relative overflow-hidden max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}>
        <button onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: 'rgba(0,0,0,0.35)', color: 'white' }}>✕</button>

        {!place && !error && (
          <p className="text-sm text-stone-400 text-center py-16">불러오는 중...</p>
        )}
        {error && (
          <p className="text-sm text-center py-16" style={{ color: '#e8486b' }}>{error}</p>
        )}

        {place && (
          <>
            <div className="relative bg-pink-100" style={{ height: '220px' }}>
              {place.imageUrl ? (
                <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">{place.emoji || '📍'}</div>
              )}
              <span className="absolute left-4 bottom-4 rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                {/* 세부분류 이모지로 표시(2026-08-28) - RecommendationCard.jsx와 동일 이유로 수정. */}
                {place.emoji || '📍'} {place.category}
              </span>
            </div>

            <div className="p-6">
              <h2 className="font-display font-bold text-lg" style={{ color: '#3d2c35' }}>{place.name}</h2>
              {place.address && (
                <p className="text-xs mt-1.5" style={{ color: '#a08b94' }}>🗺️ {place.address}</p>
              )}

              {hasPerformanceInfo && (
                <div className="mt-4 rounded-2xl p-4 space-y-1" style={{ background: '#fff8f4', border: '1.5px solid #ffd6e0' }}>
                  {place.startDate && (
                    <p className="text-xs font-semibold" style={{ color: '#3d2c35' }}>
                      📅 {formatDate(place.startDate)}{place.endDate && place.endDate !== place.startDate ? ` ~ ${formatDate(place.endDate)}` : ''}
                    </p>
                  )}
                  {place.showTimeInfo && <p className="text-xs" style={{ color: '#6d5662' }}>🕒 {place.showTimeInfo}</p>}
                  {place.runtimeText && <p className="text-xs" style={{ color: '#6d5662' }}>⏱️ {place.runtimeText}</p>}
                  {place.priceInfo && <p className="text-xs" style={{ color: '#6d5662' }}>💳 {place.priceInfo}</p>}
                  {place.bookingUrl && (
                    <a href={place.bookingUrl} target="_blank" rel="noreferrer"
                      className="inline-block mt-1 text-xs font-bold" style={{ color: '#e8486b' }}>
                      예매하러 가기 →
                    </a>
                  )}
                </div>
              )}

              {/* "성남아트센터"라는 장소 자체가 아니라 거기서 하는 다른 공연들(2026-08-27) - 장소는
                  그 콘텐츠가 열리는 좌표일 뿐이라는 제품 방향 참고. */}
              {venuePerformances.length > 0 && (
                <div className="mt-4">
                  {place.venueImageUrl && (
                    <img
                      src={place.venueImageUrl}
                      alt={place.venueName || '공연장'}
                      className="w-full h-28 object-cover rounded-xl mb-2"
                    />
                  )}
                  <p className="text-xs font-bold text-stone-400 mb-2">
                    🎭 {place.venueName || '이 공연장'}의 다른 공연
                  </p>
                  <div className="space-y-1.5">
                    {venuePerformances.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActivePlaceId(p.id)}
                        className="w-full flex items-center gap-2 rounded-xl p-2.5 text-left transition-colors hover:bg-rose-50"
                        style={{ border: '1.5px solid #f0dce2' }}
                      >
                        <span className="text-lg flex-shrink-0">{p.emoji || '🎭'}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-bold truncate" style={{ color: '#3d2c35' }}>{p.name}</span>
                          {p.boxOfficeRank != null && (
                            <span className="text-[10px] font-bold" style={{ color: '#df9235' }}>🔥 예매율 {p.boxOfficeRank}위</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {axisEntries.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold text-stone-400">이 장소의 성향</p>
                  {axisEntries.map(({ axis, score }) => (
                    <div key={axis.id} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold flex-shrink-0" style={{ color: axis.color, width: '64px' }}>
                        {axis.koreanLabel}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#f0dce2' }}>
                        <div className="h-full rounded-full" style={{ width: `${score}%`, background: axis.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
