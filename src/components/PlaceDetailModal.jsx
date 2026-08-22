import { useEffect, useState } from 'react';
import { getPlace } from '../lib/api';
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

  useEffect(() => {
    let cancelled = false;
    setPlace(null);
    setError(null);
    getPlace(placeId)
      .then((data) => { if (!cancelled) setPlace(data); })
      .catch((e) => { if (!cancelled) setError(e.message || '장소 정보를 불러오지 못했어요'); });
    return () => { cancelled = true; };
  }, [placeId]);

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
                📍 {place.category}
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
