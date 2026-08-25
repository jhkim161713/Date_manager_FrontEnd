import { useEffect, useRef, useState } from 'react';

// 새 일정 등록 모달. 큐레이션 탭 "캘린더에 담기"로 넘어온 값(2026-08-22)이 있으면 제목/날짜를
// 미리 채워둔다 - 날짜는 공연류처럼 실제 날짜를 아는 경우만 채우고, 그 외엔 빈 값으로 둬서
// 사용자가 직접 입력한다.
export function EventFormModal({ prefill, onPrefillConsumed, onClose, onSubmit }) {
  const [titleMsg, setTitleMsg] = useState('');
  const titleRef = useRef();
  const descriptionRef = useRef();
  const targetDateRef = useRef();

  useEffect(() => {
    if (!prefill) return;
    if (titleRef.current) titleRef.current.value = prefill.title || '';
    if (targetDateRef.current) targetDateRef.current.value = prefill.targetDate || '';
    onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const titleNode = titleRef.current;
    const descriptionNode = descriptionRef.current;
    const targetDateNode = targetDateRef.current;

    if (titleNode.value.trim() === '') {
      setTitleMsg('제목을 입력해주세요');
      titleNode.focus();
      return;
    }
    if (targetDateNode.value === '') {
      setTitleMsg('날짜를 선택해주세요');
      targetDateNode.focus();
      return;
    }
    setTitleMsg('');

    onSubmit({
      title: titleNode.value.trim(),
      description: descriptionNode.value.trim(),
      targetDate: targetDateNode.value,
    })
      .then(() => onClose())
      .catch((e) => console.log('일정 등록 실패:', e));
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(61, 44, 53, 0.35)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] rounded-2xl p-5 bg-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-sm" style={{ color: '#3d2c35' }}>새 일정 등록</span>
          <button type="button" onClick={onClose} className="text-sm" style={{ color: '#c9b8c2' }}>✕</button>
        </div>

        <div className="mb-3">
          <label htmlFor="title" className="block text-[11px] font-bold mb-1" style={{ color: '#3d2c35' }}>제목</label>
          <input
            ref={titleRef}
            type="text"
            id="title"
            name="title"
            placeholder="예: 영화 데이트"
            className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
            style={{ borderColor: '#f0dbe4' }}
          />
          {titleMsg && <span className="text-[11px]" style={{ color: '#ff4d6d' }}>{titleMsg}</span>}
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="block text-[11px] font-bold mb-1" style={{ color: '#3d2c35' }}>메모</label>
          <textarea
            ref={descriptionRef}
            id="description"
            name="description"
            rows={2}
            placeholder="메모를 입력해주세요"
            className="w-full text-sm px-3 py-2 rounded-lg border outline-none resize-none"
            style={{ borderColor: '#f0dbe4' }}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="targetDate" className="block text-[11px] font-bold mb-1" style={{ color: '#3d2c35' }}>날짜</label>
          <input
            ref={targetDateRef}
            type="date"
            id="targetDate"
            name="targetDate"
            className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
            style={{ borderColor: '#f0dbe4' }}
          />
        </div>

        <button
          type="submit"
          className="w-full text-sm font-bold py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}
        >
          등록하기
        </button>
      </form>
    </div>
  );
}
