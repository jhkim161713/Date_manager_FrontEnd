import { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (name: string) => void;
}

export function LoginModal({ onClose, onLogin }: { onClose: () => void; onLogin: (name: string) => void }) {
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61,44,53,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="rounded-3xl p-7 w-full max-w-xs relative"
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}
        onClick={e => e.stopPropagation()}>
        {/* Deco top */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)' }}>💕</div>

        <h2 className="font-display font-bold text-xl text-center mt-2 mb-1" style={{ color: '#3d2c35' }}>로그인</h2>
        <p className="text-xs text-center text-stone-400 mb-5">우리만의 공간에 오신 걸 환영해요 🌸</p>

        <div className="space-y-3">
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
            <span className="text-sm">🌷</span>
            <input className="flex-1 text-sm outline-none bg-transparent" placeholder="아이디"
              value={name} onChange={e => setName(e.target.value)}
              style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
          </div>
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ border: '1.5px solid #ffd6e0', background: '#fff8f4' }}>
            <span className="text-sm">🔑</span>
            <input type="password" className="flex-1 text-sm outline-none bg-transparent" placeholder="비밀번호"
              value={pw} onChange={e => setPw(e.target.value)}
              style={{ fontFamily: 'Nunito, sans-serif', color: '#3d2c35' }} />
          </div>
        </div>

        <button onClick={() => { if (name) { onLogin(name); onClose() } }}
          className="mt-4 w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
          로그인 💖
        </button>
        <p className="text-center text-xs text-stone-400 mt-3 cursor-pointer hover:text-pink-400 transition-colors">
          아직 계정이 없으신가요? <span style={{ color: '#ff6b8a', fontWeight: 700 }}>회원가입</span>
        </p>
      </div>
    </div>
  )
}