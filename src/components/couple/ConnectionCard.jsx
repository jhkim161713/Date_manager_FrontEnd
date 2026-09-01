import { Avatar } from '../Avatar';

const todayStr = () => new Date().toISOString().slice(0, 10);

function formatMetDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// "우리의 연결" 카드 - 나/파트너 아바타, 관리자 재연결 배너, 만난 날짜 입력/수정, 연결 해제.
// CoupleTab.jsx에서 그대로 옮김.
export function ConnectionCard({
  user, status,
  metDateInput, setMetDateInput, metDateSaving, metDateError,
  isEditingMetDate, setIsEditingMetDate, onSaveMetDate, onCancelEditMetDate,
  onDisconnect, onAckAdminReconnect,
}) {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="relative rounded-[26px] bg-white px-6 py-6" style={{ border: '1px solid rgba(255, 214, 224, 0.9)', boxShadow: '0 15px 35px rgba(101, 66, 80, 0.1)' }}>
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-extrabold" style={{ color: '#5c4651' }}>우리의 연결</span>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: status.linked ? '#f0fbf6' : '#fff0f3', color: status.linked ? '#2fa876' : '#e8486b' }}>
            {status.loading ? '확인 중...' : status.linked ? '연결됨' : '미연결'}
          </span>
        </div>
        {/* 나/파트너 아바타 - 96px로 확대 + 이름 글씨도 키움(2026-09-01, "사진이랑 이름이 작고
            흐릿해 보인다"는 피드백) - object-cover는 그대로라 원본 비율은 유지되고, 렌더링 크기가
            커진 만큼 같은 원본 사진이 더 선명하게 보인다. */}
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <Avatar profileImageUrl={user?.profileImageUrl} gender={user?.gender} size={96} className="mx-auto" />
            <p className="mt-2 text-sm font-extrabold" style={{ color: '#5c4651' }}>나</p>
          </div>
          <div className="flex min-w-20 flex-1 items-center" aria-hidden="true">
            <span className="h-px flex-1 border-t-2 border-dashed" style={{ borderColor: '#f2bdca' }} />
            <span className="mx-2 flex h-9 w-9 items-center justify-center rounded-full text-sm" style={{ background: '#fff0f3' }}>💗</span>
            <span className="h-px flex-1 border-t-2 border-dashed" style={{ borderColor: '#f2bdca' }} />
          </div>
          <div className="text-center">
            {status.linked ? (
              <Avatar profileImageUrl={status.partner?.profileImageUrl} gender={status.partner?.gender}
                size={96} className="mx-auto" />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed text-2xl opacity-50" style={{ background: '#fbf8f6', borderColor: '#dfd2d7', color: '#b9a7ae' }}>+</div>
            )}
            <p className="mt-2 text-sm font-extrabold" style={{ color: status.linked ? '#5c4651' : '#a28d97' }}>
              {status.linked ? (status.partner?.nickname || '내 파트너') : '내 파트너'}
            </p>
          </div>
        </div>
        {status.linked ? (
          <>
            {/* 관리자가 방금 "다시 연결"을 눌러준 경우에만 뜨는 알림 */}
            {status.reconnectedByAdminAt && (
              <div className="mt-5 rounded-2xl px-4 py-3" style={{ background: '#f7f2fb', border: '1.5px solid #e8d5f5' }}>
                <p className="text-[11px] font-bold" style={{ color: '#8b65ad' }}>
                  💌 관리자가 커플 연결을 다시 이어줬어요! 연결일이 오늘로 새로 시작됐어요.
                </p>
                <button type="button" onClick={onAckAdminReconnect}
                  className="mt-2 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                  style={{ background: 'white', color: '#8b65ad', border: '1.5px solid #e8d5f5' }}>
                  확인했어요
                </button>
              </div>
            )}
            <div className="mt-5">
              <label className="block text-[10px] font-extrabold mb-1.5" style={{ color: '#6d5662' }}>{!status.metDate ? '👉 만난 날짜' : '만난 날짜'}</label>
              {status.metDate && !isEditingMetDate ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold" style={{ color: '#5c4651' }}>{formatMetDate(status.metDate)}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingMetDate(true)}
                    className="flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition-all"
                    style={{ background: '#fff0f3', color: '#e8486b' }}
                  >
                    ✏️ 수정
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={metDateInput}
                      max={todayStr()}
                      onChange={e => setMetDateInput(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                      style={{ border: '1.5px solid #f0dbe1', background: 'white', color: '#5c4651' }}
                    />
                    <button
                      type="button"
                      onClick={onSaveMetDate}
                      disabled={metDateSaving || metDateInput === (status.metDate || '')}
                      className="flex-shrink-0 rounded-xl px-3 py-2 text-[11px] font-extrabold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #ff6b8a, #c98fd4)' }}
                    >
                      {metDateSaving ? '저장 중' : '저장'}
                    </button>
                    {status.metDate && (
                      <button
                        type="button"
                        onClick={onCancelEditMetDate}
                        className="flex-shrink-0 rounded-xl px-3 py-2 text-[11px] font-extrabold transition-all"
                        style={{ background: '#f7f2fb', color: '#9a75bb' }}
                      >
                        취소
                      </button>
                    )}
                  </div>
                  {metDateError && <p className="mt-1 text-[10px]" style={{ color: '#e8486b' }}>{metDateError}</p>}
                </>
              )}
            </div>
            <button type="button" onClick={onDisconnect}
              className="mt-4 w-full rounded-xl py-2.5 text-[11px] font-extrabold"
              style={{ background: '#f7f2fb', color: '#9a75bb' }}>
              연결 해제하기
            </button>
          </>
        ) : (
          <p className="mt-6 text-center text-[11px] leading-5" style={{ color: '#a28d97' }}>
            상대가 링크를 열고 초대를 수락하면<br />내 파트너와의 공간이 열려요.
          </p>
        )}
      </div>
    </div>
  );
}
