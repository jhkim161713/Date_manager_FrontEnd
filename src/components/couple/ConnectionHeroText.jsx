// 연결 상태(미연결 / 연결됐지만 만난 날짜 없음 / 만난 날짜까지 있음)에 따라 히어로 좌측 문구가
// 3단계로 바뀐다. CoupleTab.jsx에서 그대로 옮김.
export function ConnectionHeroText({ status, daysTogether, milestone, creatingInvite, inviteLink, onMakeInviteLink, onGoBuilder }) {
  if (!status.linked) {
    return (
      <>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-extrabold" style={{ color: '#e8486b' }}>
          💌 둘만의 작은 공간
        </span>
        <h1 className="font-display mt-4 text-3xl font-bold leading-[1.25] md:text-[2.35rem]" style={{ color: '#3d2c35' }}>
          초대장 하나로,
          <br />
          <span style={{ color: '#e8486b' }}>우리 둘을 연결해요</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: '#7f6873' }}>
          소중한 사람에게 초대 링크를 보내 보세요. 연결이 완료되면 서로의 취향을 맞춰 보고,
          <br />
          함께 가고 싶은 데이트도 한곳에 담아보세요.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onMakeInviteLink}
            disabled={creatingInvite}
            className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #e96fa6)', boxShadow: '0 8px 20px rgba(232, 72, 107, 0.24)' }}
          >
            {creatingInvite ? '만드는 중...' : inviteLink ? '새 링크 만들기' : '초대 링크 만들기'}
          </button>
        </div>
      </>
    );
  }

  if (!status.metDate) {
    return (
      <>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-extrabold" style={{ color: '#e8486b' }}>
          💕 연결 완료
        </span>
        <h1 className="font-display mt-4 text-3xl font-bold leading-[1.25] md:text-[2.35rem]" style={{ color: '#3d2c35' }}>
          사귀기 시작한 날짜를
          <br />
          <span style={{ color: '#e8486b' }}>알려주세요</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: '#7f6873' }}>
          만난 날짜를 입력하면, 그날부터 함께한 시간을 세어드릴게요.
        </p>
      </>
    );
  }

  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-extrabold" style={{ color: '#e8486b' }}>
        💕 함께한 지 {daysTogether}일째
      </span>
      <h1 className="font-display mt-4 text-3xl font-bold leading-[1.25] md:text-[2.35rem]" style={{ color: '#3d2c35' }}>
        다음 {milestone}일까지
        <br />
        <span style={{ color: '#e8486b' }}>D-{milestone - daysTogether}</span>
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: '#7f6873' }}>
        우리만의 이야기가 하루하루 쌓이고 있어요.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onGoBuilder}
          className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #e96fa6)', boxShadow: '0 8px 20px rgba(232, 72, 107, 0.24)' }}
        >
          우리 데이트 코스 짜러 가기 →
        </button>
      </div>
    </>
  );
}
