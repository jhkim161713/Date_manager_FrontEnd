// window.confirm()은 브라우저/OS가 직접 그리는 네이티브 다이얼로그라 버튼 문구("OK"/"Cancel")가
// 앱 코드가 아니라 기기 시스템 언어를 따라간다 - 안드로이드 앱에서 나머지 화면은 다 한글인데
// 이 버튼만 영어로 뜨는 원인(2026-09-02). ConfirmDialogHost가 실제 렌더링을 담당하고, 이 모듈은
// 그 host에 요청을 전달하는 창구 역할만 한다.
let showHandler = null;

export function registerConfirmHost(handler) {
  showHandler = handler;
}

export function confirm(message, options = {}) {
  if (!showHandler) return Promise.resolve(window.confirm(message));
  return showHandler(message, options);
}
