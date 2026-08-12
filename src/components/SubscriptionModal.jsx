import { useEffect, useRef, useState } from 'react';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { getMySubscription, issueBillingKey } from '@/lib/api';

// 토스페이먼츠 클라이언트 키(공개 키라 프론트에 노출해도 안전함) - 팀원 개인 테스트 상점의 API 개별연동 키
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_ma60RZblrq5vYRA526lZrwzYWBn1';

// 테스트 단계 가격 - 상용화 목적이 아니라 결제 흐름 검증용이라 990원으로 둠
const PLAN = { code: 'PREMIUM_MONTHLY', label: '프리미엄 월간 구독', amount: 990 };

// 카드 등록 인증(requestBillingAuth)이 끝나면 토스가 successUrl로 authKey/customerKey를 쿼리스트링에
// 실어 리다이렉트한다. App.jsx가 그 쿼리스트링을 읽어서 이 모달을 다시 열고 발급을 마무리한다.
export function SubscriptionModal({ user, onClose, pendingBillingAuth }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMySubscription()
      .then(setSubscription)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 결제 성공 리다이렉트로 돌아온 직후라면 authKey/customerKey로 빌링키 발급을 마무리한다.
  // authKey는 1회용이라, StrictMode(개발모드)가 이 이펙트를 두 번 실행하면 두 번째 요청은
  // "이미 소비된 authKey"로 실패한다. 같은 authKey는 한 번만 요청하도록 ref로 막는다.
  const issuedAuthKeyRef = useRef(null);
  useEffect(() => {
    if (!pendingBillingAuth) return;
    if (issuedAuthKeyRef.current === pendingBillingAuth.authKey) return;
    issuedAuthKeyRef.current = pendingBillingAuth.authKey;

    setProcessing(true);
    issueBillingKey({ ...pendingBillingAuth, planCode: PLAN.code })
      .then(sub => { setSubscription(sub); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setProcessing(false));
  }, [pendingBillingAuth]);

  const startBillingAuth = async () => {
    setError(null);
    setProcessing(true);
    try {
      const customerKey = `user-${user.id}`;
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey });
      await payment.requestBillingAuth({
        method: 'CARD',
        successUrl: window.location.origin + window.location.pathname,
        failUrl: window.location.origin + window.location.pathname + '?billingError=1',
        customerEmail: user.email,
        customerName: user.nickname,
      });
      // 성공/실패 모두 토스 인증 페이지로 리다이렉트되므로 여기서는 더 할 일이 없음
    } catch (e) {
      setError(e.message || '카드 등록 창을 여는 중 문제가 발생했어요');
      setProcessing(false);
    }
  };

  const hasBilling = subscription?.hasBillingKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61,44,53,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-3xl p-7 w-full max-w-sm relative"
        style={{ background: 'white', boxShadow: '0 20px 60px rgba(255,107,138,0.18)' }}>
        <button onClick={onClose}
          className="absolute right-5 top-5 text-stone-400 hover:text-stone-600 text-sm font-bold">✕</button>

        <h2 className="font-display font-bold text-xl mb-1" style={{ color: '#3d2c35' }}>💳 구독</h2>
        <p className="text-xs text-stone-400 mb-6">토스페이먼츠로 안전하게 결제돼요</p>

        {loading || processing ? (
          <p className="text-sm text-stone-400 text-center py-6">
            {processing ? '카드 등록 처리 중...' : '불러오는 중...'}
          </p>
        ) : hasBilling ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: '#fff0f3', border: '1.5px solid #ffd6e0' }}>
            <p className="text-sm font-bold" style={{ color: '#3d2c35' }}>{subscription.planCode}</p>
            <p className="text-xs text-stone-400 mt-1">상태: {subscription.status}</p>
            <p className="text-xs mt-3" style={{ color: '#4dbfa8' }}>카드 등록 완료 ✅</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-5 mb-4" style={{ background: '#fff8f4', border: '1.5px solid #ffd6e0' }}>
              <p className="text-sm font-bold" style={{ color: '#3d2c35' }}>{PLAN.label}</p>
              <p className="text-lg font-display font-bold mt-1" style={{ color: '#ff6b8a' }}>
                월 {PLAN.amount.toLocaleString()}원
              </p>
            </div>
            <button onClick={startBillingAuth} disabled={processing}
              className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ff6b8a, #c4a0e8)', boxShadow: '0 6px 20px rgba(255,107,138,0.3)' }}>
              카드 등록하고 구독하기
            </button>
          </>
        )}

        {error && <p className="text-center text-xs mt-4" style={{ color: '#e8486b' }}>{error}</p>}
      </div>
    </div>
  );
}
