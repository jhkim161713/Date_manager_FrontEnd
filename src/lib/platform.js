import { Capacitor } from '@capacitor/core';

// 안드로이드 실기기 점검(2026-09-01)에서 찾은 좁은 화면 레이아웃 수정들을 안드로이드 앱에서만
// 적용하기 위한 공용 플래그 - 웹은 창을 좁혀도 예전 모습 그대로 유지해야 한다는 요청.
// App.jsx의 IS_ANDROID_APP과 같은 값이지만, 여러 컴포넌트에서 import해서 쓰기 위해 분리했다.
export const IS_ANDROID_APP = Capacitor.getPlatform() === 'android';
