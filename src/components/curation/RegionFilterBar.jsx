import { REGIONS, SUB_REGIONS } from '../../data/curationRegions';
import { IS_ANDROID_APP } from '../../lib/platform';

// 지역 필터 - 특정 지역을 고르면 위치 기반 정렬(useNearby)은 자동으로 꺼진다(지금 위치와
// 무관하게 그 지역을 보고 싶은 거라서, useCurationPlaces의 useNearby 파생 로직 참고).
// 에너지 게이지(2026-08-20)는 사용자 요청으로 이 지역 칩 줄 바로 옆에 배치했다 - 건전지
// 이모지 + 초록 계열 색상. 서울/경기를 고르면 나오는 구/시 세부 필터도 여기서 같이 그린다.
export function RegionFilterBar({ region, setRegion, subRegion, setSubRegion, energyTarget, setEnergyTarget }) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => {
              setRegion('');
              setSubRegion('');
            }}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
            style={{
              background: region === '' ? '#4f3d46' : 'white',
              color: region === '' ? 'white' : '#7c6a72',
              border: '1.5px solid #f0dce2',
            }}
          >
            🗺️ 전체 지역
          </button>
          {REGIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setRegion(region === item ? '' : item);
                setSubRegion(''); // 시/도를 바꾸면 이전에 골라둔 구/시는 더 이상 안 맞을 수 있어서 초기화
              }}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
              style={{
                background: region === item ? '#4f3d46' : 'white',
                color: region === item ? 'white' : '#7c6a72',
                border: '1.5px solid #f0dce2',
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* 에너지 게이지 - 유저 성향값 저장 파이프라인이 아직 없어서(온보딩 미완성) 지금 당장은 그
            순간 원하는 활력 정도를 직접 조정하는 임시 방식으로 만듦. 값을 만지면 scoreEnergy가 가까운
            장소 순으로 정렬되고(필터가 아니라 정렬이라 결과 수는 그대로), 안 만지면(null) 기존
            정렬(최신순) 그대로 동작한다. 전체 문장 라벨이 좁은 화면에서 지역 칩 자리를 다 잡아먹어서
            (2026-09-01, 안드로이드 실기기 캡처로 발견) 안드로이드 앱에서만 배터리 이모지만 남긴다. */}
        <div className={`flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white py-1.5 ${IS_ANDROID_APP ? 'px-2.5' : 'px-3'}`} style={{ border: '1.5px solid #cdeacd' }}>
          {IS_ANDROID_APP ? (
            <span className="text-xs" title="당신의 에너지를 입력하세요">🔋</span>
          ) : (
            <>
              <span className="whitespace-nowrap text-[10px] font-bold" style={{ color: '#5a8a5f' }}>
                당신의 에너지를 입력하세요
              </span>
              <span className="text-xs">🔋</span>
            </>
          )}
          <input
            type="range"
            min={0}
            max={100}
            value={energyTarget ?? 50}
            onChange={(event) => setEnergyTarget(Number(event.target.value))}
            className={`${IS_ANDROID_APP ? 'w-12' : 'w-20'} accent-[#4caf6e]`}
          />
          {energyTarget != null && (
            <button
              type="button"
              onClick={() => setEnergyTarget(null)}
              className="text-[10px] font-bold"
              style={{ color: '#8fae8f' }}
              title="에너지 게이지 초기화"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 서울/경기 구/시 세부 필터 - 데이터가 많은 두 지역만 한 단계 더 좁혀볼 수 있게 함(2026-08-19).
          경기는 시/군이 31개라 너무 많아서 권역(북부/동북/동부/서부/남부) 라벨로 나눠 보여준다. */}
      {SUB_REGIONS[region] && (
        <div className="flex flex-col gap-1.5">
          {SUB_REGIONS[region].map((group) => (
            <div key={group.zone ?? 'all'} className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {group.zone && (
                <span className="flex-shrink-0 text-[10px] font-extrabold" style={{ color: '#b19fa6', width: '30px' }}>
                  {group.zone}
                </span>
              )}
              {group.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubRegion(subRegion === item ? '' : item)}
                  className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all"
                  style={{
                    background: subRegion === item ? '#e8486b' : '#fff7f8',
                    color: subRegion === item ? 'white' : '#a9838d',
                    border: `1px solid ${subRegion === item ? '#e8486b' : '#f6dde2'}`,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
