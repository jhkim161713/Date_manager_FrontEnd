import { useEffect, useState } from 'react';
import { getPlaces } from '../lib/api';

// place_styles 테이블에 채운 성향점수(에너지/몰입/분위기/미감/깊이)가 실제 API를 통해 잘 내려오는지
// 눈으로 확인하기 위한 디버그용 화면. CurationTab처럼 가격/평점 등 실제 데이터에 없는 항목은 없고,
// 백엔드가 실제로 갖고 있는 값만 그대로 보여준다.
const SCORE_AXES = [
  { key: 'scoreEnergy', label: '에너지', color: '#e8486b' },
  { key: 'scoreImmersion', label: '몰입', color: '#806bb4' },
  { key: 'scoreVibe', label: '분위기', color: '#f9a030' },
  { key: 'scoreAesthetic', label: '미감', color: '#4aa3c4' },
  { key: 'scoreDepth', label: '깊이', color: '#4d9d6f' },
];

export function PlaceStyleDebugTab() {
  const [places, setPlaces] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlaces = async () => {
      setLoading(true);
      setError('');
      try {
        const page = await getPlaces({ category, size: 24 });
        setPlaces(page.content);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPlaces();
  }, [category]);

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h3 className="font-display text-lg font-bold" style={{ color: '#45343d' }}>
          🔧 성향점수 디버그 (실제 API 데이터)
        </h3>
        <p className="mt-1 text-xs" style={{ color: '#8e7882' }}>
          place_styles 테이블에 채운 값이 실제 /api/places 응답에 잘 실려오는지 확인하는 임시 화면입니다.
        </p>
      </div>

      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="카테고리로 필터 (예: 숙박, 맛집, 액티비티... 비우면 전체)"
        className="w-full max-w-md rounded-xl px-3 py-2 text-xs outline-none"
        style={{ border: '1px solid #eadde1' }}
      />

      {loading && <p className="text-xs" style={{ color: '#a08b94' }}>불러오는 중...</p>}
      {error && <p className="text-xs font-bold" style={{ color: '#e8486b' }}>에러: {error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <article
            key={place.id}
            className="rounded-2xl bg-white p-4"
            style={{ border: '1.5px solid #f0dce2', boxShadow: '0 5px 18px rgba(89, 58, 70, 0.06)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <strong className="truncate text-sm" style={{ color: '#43323a' }}>{place.name}</strong>
              <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: '#fff0f3', color: '#e8486b' }}>
                {place.category}
              </span>
            </div>
            <p className="mt-1 truncate text-[10px]" style={{ color: '#9f8992' }}>{place.address}</p>

            {place.scoreEnergy == null ? (
              <p className="mt-3 text-[10px] font-bold" style={{ color: '#c99' }}>⚠ 성향점수 없음 (place_styles 행 없음)</p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {SCORE_AXES.map((axis) => (
                  <div key={axis.key} className="flex items-center gap-2">
                    <span className="w-10 flex-shrink-0 text-[9px] font-bold" style={{ color: '#8e7882' }}>{axis.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: '#f3edef' }}>
                      <div className="h-full rounded-full" style={{ width: `${place[axis.key]}%`, background: axis.color }} />
                    </div>
                    <span className="w-6 flex-shrink-0 text-right text-[9px] font-bold" style={{ color: '#8e7882' }}>{place[axis.key]}</span>
                  </div>
                ))}
                <div className="flex gap-1.5 pt-1">
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: place.isIndoor ? '#eef1ff' : '#eafff2', color: place.isIndoor ? '#6b6bb4' : '#2f9e63' }}>
                    {place.isIndoor ? '실내' : '실외'}
                  </span>
                  {place.isActivity ? (
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#fff3e0', color: '#c47d10' }}>
                      액티비티
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {!loading && !error && places.length === 0 && (
        <p className="text-xs" style={{ color: '#a08b94' }}>결과가 없어요.</p>
      )}
    </div>
  );
}
