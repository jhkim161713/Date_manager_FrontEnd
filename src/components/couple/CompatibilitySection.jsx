import { PERSONA_AXES } from '../../data/onboardingData';

// 성향 궁합 그래프의 점 색상. Avatar 컴포넌트와 같은 규칙(FEMALE만 핑크, 나머지는 블루)을 따른다.
const genderColor = (gender) => (gender === 'FEMALE' ? '#e8486b' : '#4a90d9');

// 연결된 커플에게만 보이는 "성향 궁합" 섹션. 파트너 실제 점수는 UserStyle API가 아직 없어서
// 항상 중립값(50)으로 표시된다 - CoupleTab.jsx에서 그대로 옮김.
export function CompatibilitySection({ user, partner, personaProfile }) {
  return (
    <section className="rounded-[26px] bg-white p-5 md:p-6" style={{ border: '1.5px solid #f3dde3', boxShadow: '0 6px 20px rgba(127, 76, 92, 0.05)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🧩</span>
          <h3 className="font-display text-lg font-bold" style={{ color: '#3d2c35' }}>성향 궁합</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1" style={{ color: genderColor(user?.gender) }}>
            <span className="h-2 w-2 rounded-full" style={{ background: genderColor(user?.gender) }} />나
          </span>
          <span className="flex items-center gap-1" style={{ color: genderColor(partner?.gender) }}>
            <span className="h-2 w-2 rounded-full" style={{ background: genderColor(partner?.gender) }} />{partner?.nickname || '파트너'}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs" style={{ color: '#a28d97' }}>나와 파트너의 문화생활 성향 점수를 비교할 수 있어요.</p>

      <div className="mt-5 space-y-4">
        {PERSONA_AXES.map(({ id, koreanLabel, lowLabel, highLabel }) => {
          const myScore = personaProfile?.scores?.[id] ?? 50;
          // 파트너 실제 점수는 UserStyle API가 아직 없어서 못 가져옴 - 백엔드 준비되면
          // getPersonaScoreComparison() 같은 함수로 이 값을 실제 조회값으로 교체할 것.
          const partnerScore = 50;

          return (
            <div key={id}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold" style={{ color: '#6d5662' }}>{koreanLabel}</span>
                <span className="text-[10px] font-bold">
                  <span style={{ color: genderColor(user?.gender) }}>나: {myScore}</span>
                  <span className="mx-1" style={{ color: '#d8c8ce' }}>·</span>
                  <span style={{ color: genderColor(partner?.gender) }}>파트너: {partnerScore}</span>
                </span>
              </div>
              <div className="relative mt-1.5 h-2 rounded-full" style={{ background: '#f3e9ec' }}>
                <div className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow-sm" style={{ left: `calc(${myScore}% - 7px)`, background: genderColor(user?.gender) }} />
                <div className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow-sm" style={{ left: `calc(${partnerScore}% - 7px)`, background: genderColor(partner?.gender) }} />
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-[10px] text-stone-400">{lowLabel}</span>
                <span className="text-[10px] text-stone-400">{highLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[10px]" style={{ color: '#b09da5' }}>
        파트너의 성향 점수는 아직 실제 연동 전이라 중립값(50)으로 표시돼요.
      </p>
    </section>
  );
}
