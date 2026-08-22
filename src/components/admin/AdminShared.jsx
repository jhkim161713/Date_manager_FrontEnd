export const GENDER_LABEL = { MALE: '남성', FEMALE: '여성', UNKNOWN: '선택 안 함' };
export const GENDER_OPTIONS = ['UNKNOWN', 'MALE', 'FEMALE'];

// Report.targetType/status 값과 1:1로 맞춰야 한다 (report/entity/Report.java, ReportController 참고).
export const REPORT_TARGET_LABEL = { USER: '회원', POST: '게시글', COMMENT: '댓글' };
export const REPORT_STATUS_LABEL = { PENDING: '대기중', RESOLVED: '처리완료', REJECTED: '반려' };
export const REPORT_STATUS_OPTIONS = ['PENDING', 'RESOLVED', 'REJECTED'];

export function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
}

export function SubscribedBadge({ subscribed }) {
  if (!subscribed) return null;
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ml-1.5"
      style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', color: 'white' }}>구독중</span>
  );
}

export function FilterTabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
      style={{
        background: active ? '#fff0f3' : 'transparent',
        color: active ? '#ff6b8a' : '#8a7a80',
        border: active ? '1.5px solid #ffd6e0' : '1.5px solid transparent',
      }}>
      {children}
    </button>
  );
}
