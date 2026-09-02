import { useEffect, useRef, useState } from 'react';
import { registerConfirmHost } from '../lib/confirm';

// window.confirm()을 대체하는 앱 테마 확인 모달(2026-09-02) - App.jsx에 한 번만 마운트해두면,
// 어디서든 lib/confirm.js의 confirm(message, options)을 await로 호출해 쓸 수 있다.
export function ConfirmDialogHost() {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  useEffect(() => {
    registerConfirmHost((message, options = {}) => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setDialog({
          message,
          confirmText: options.confirmText || '확인',
          cancelText: options.cancelText || '취소',
          danger: options.danger ?? false,
        });
      });
    });
  }, []);

  const close = (result) => {
    setDialog(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  if (!dialog) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(61,44,53,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={() => close(false)}>
      <div onClick={(e) => e.stopPropagation()}
        className="rounded-3xl p-6 w-full max-w-xs"
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}>
        <p className="text-sm text-center leading-relaxed whitespace-pre-line" style={{ color: '#3d2c35' }}>
          {dialog.message}
        </p>
        <div className="flex gap-2.5 mt-5">
          <button type="button" onClick={() => close(false)}
            className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{ border: '1.5px solid #ffd6e0', color: '#3d2c35', background: 'white' }}>
            {dialog.cancelText}
          </button>
          <button type="button" onClick={() => close(true)}
            className="flex-1 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{
              background: dialog.danger ? '#e8486b' : 'linear-gradient(135deg, #ff6b8a, #c4a0e8)',
              boxShadow: '0 6px 20px rgba(255,107,138,0.3)',
            }}>
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
