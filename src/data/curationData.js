// 큐레이션 탭 "데이트" 화면은 이제 목업 배열 대신 getCurationPlaces()로 실데이터를 받아온다
// (CurationTab.jsx 참고, 2026-08-14). 코스 빌더에 담은 장소를 다른 탭(코스 빌더)과 주고받을 때
// 쓰는 localStorage 키만 여기 남겨둔다.
export const BUILDER_STORAGE_KEY = 'dateManager.builderQueue.v1';

// 큐레이션 탭에서 "코스 빌더에 담기"로 고른, 아직 안 보낸 후보 목록(담기함) 저장용(2026-08-20).
// 위 BUILDER_STORAGE_KEY(보내기를 누른 뒤의 큐)와 달리, 담는 순간마다 계속 갱신돼서 카테고리를
// 넘나들거나 다른 탭에 갔다 와도 살아있어야 한다 - 그래서 로그인 계정과 무관하게 로그아웃(App.jsx
// handleLogout)에서만 명시적으로 지운다.
export const CURATION_CART_STORAGE_KEY = 'dateManager.curationCart.v1';
