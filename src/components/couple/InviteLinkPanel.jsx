import { COUPLE_SINK_BENEFITS } from '../../data/coupleSink';

// 미연결 상태일 때 보이는 좌측 패널 - 초대 링크 만들기/공유, 받은 링크 수락, 혜택 소개.
// CoupleTab.jsx에서 그대로 옮김.
export function InviteLinkPanel({
  inviteLink, onCopyInviteLink, onShareInviteLink,
  acceptToken, setAcceptToken, accepting, onAcceptInvite,
}) {
  return (
    <div className="rounded-[26px] bg-white p-5 md:p-6" style={{ border: '1.5px solid #f3dde3', boxShadow: '0 6px 20px rgba(127, 76, 92, 0.05)' }}>
      <div>
        <h3 className="font-display text-lg font-bold" style={{ color: '#3d2c35' }}>초대 링크 보내기</h3>
        <p className="mt-1 text-xs" style={{ color: '#a28d97' }}>나의 연인에게 링크를 보내고 연결을 시작해 보세요.</p>
      </div>

      <label className="mt-5 block text-[11px] font-extrabold" style={{ color: '#6d5662' }}>내 파트너 초대 링크</label>
      <div className="mt-2 flex items-center gap-2 rounded-2xl p-2 pl-4" style={{ background: inviteLink ? '#fffaf8' : '#faf7f6', border: '1.5px solid #f0dbe1' }}>
        <span aria-hidden="true">🔗</span>
        <input
          type="text"
          readOnly
          value={inviteLink}
          placeholder="버튼을 누르면 초대 링크가 만들어져요"
          aria-label="내 파트너 초대 링크"
          className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:font-normal placeholder:text-stone-400"
          style={{ color: '#5c4651' }}
        />
        <button
          type="button"
          onClick={onCopyInviteLink}
          className="flex-shrink-0 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all hover:scale-[1.03]"
          style={{ background: inviteLink ? '#fff0f3' : '#eee8ea', color: inviteLink ? '#e8486b' : '#99878e' }}
        >
          {inviteLink ? '링크 복사' : '링크 만들기'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px]" style={{ color: '#b09da5' }}>링크는 1시간 동안 유효하며, 연결되면 자동으로 만료돼요.</p>
        <button type="button" onClick={onShareInviteLink} className="rounded-xl px-4 py-2 text-xs font-extrabold" style={{ border: '1.5px solid #e8d5f5', color: '#8b65ad', background: '#fcfaff' }}>
          공유하기 ↗
        </button>
      </div>

      <div className="mt-5 rounded-2xl p-4" style={{ background: '#f9f6ff', border: '1.5px dashed #e3d3f5' }}>
        <label className="block text-[11px] font-extrabold" style={{ color: '#6d5662' }}>
          받은 초대 링크 수락하기
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={acceptToken}
            onChange={e => setAcceptToken(e.target.value)}
            placeholder="상대가 보낸 링크를 붙여넣으세요"
            className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none placeholder:font-normal placeholder:text-stone-400"
            style={{ border: '1.5px solid #f0dbe1', background: 'white', color: '#5c4651' }}
          />
          <button
            type="button"
            onClick={onAcceptInvite}
            disabled={accepting}
            className="flex-shrink-0 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #c98fd4)' }}
          >
            {accepting ? '연결 중...' : '수락하기'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {COUPLE_SINK_BENEFITS.map((benefit) => (
          <article key={benefit.title} className="rounded-2xl p-4" style={{ background: benefit.background, border: `1px solid ${benefit.border}` }}>
            <span className="text-xl" aria-hidden="true">{benefit.emoji}</span>
            <h4 className="mt-2 text-xs font-extrabold" style={{ color: '#4c3943' }}>{benefit.title}</h4>
            <p className="mt-1 text-[10px] leading-4" style={{ color: '#927f88' }}>{benefit.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
