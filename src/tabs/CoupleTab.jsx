import { SectionTitle } from '../components/SectionTitle';

export function CoupleTab() {
  return (
    <div>
      <SectionTitle sub="상대방과 연결하고 함께 취향을 맞춰봐요">커플 싱크 💞</SectionTitle>
      <div className="rounded-3xl p-10 flex flex-col items-center justify-center text-center"
        style={{ background: 'white', border: '1.5px solid #ffd6e0', boxShadow: '0 2px 12px rgba(255,107,138,0.08)' }}>
        <span className="text-4xl mb-3">💌</span>
        <p className="font-bold text-sm" style={{ color: '#3d2c35' }}>아직 연결된 상대가 없어요</p>
        <p className="text-xs text-stone-400 mt-1.5">초대 코드를 공유해서 커플 싱크를 시작해보세요</p>
        <button className="mt-5 px-5 py-2.5 rounded-2xl font-bold text-xs text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 4px 14px rgba(255,107,138,0.3)' }}>
          💕 초대 코드 만들기
        </button>
      </div>
    </div>
  )
}
