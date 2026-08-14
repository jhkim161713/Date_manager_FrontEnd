// 큐레이션 탭 "데이트" 화면은 이제 목업 배열 대신 getCurationPlaces()로 실데이터를 받아온다
// (CurationTab.jsx 참고, 2026-08-14). 코스 빌더에 담은 장소를 다른 탭(코스 빌더)과 주고받을 때
// 쓰는 localStorage 키만 여기 남겨둔다.
export const BUILDER_STORAGE_KEY = 'dateManager.builderQueue.v1';
