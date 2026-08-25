import { useEffect, useState } from 'react';
import { getLikedPlaceIds, likePlace, unlikePlace } from '../lib/api';

// 2026-08-22 - 좋아요가 이제 서버(place_likes)에 실제로 저장돼서, 탭을 처음 열 때 저장된
// 찜 목록을 불러와 두 리스트(데이트/숙박)에 그대로 채운다 - 카테고리가 겹치지 않아 한쪽에
// 다른 모드 id가 섞여 있어도 화면엔 지장 없다. 로그인 안 했으면(401) 조용히 빈 목록으로 둔다.
export function useLikedPlaces({ onStyleChanged }) {
  const [likedItemIds, setLikedItemIds] = useState([]);
  const [likedStayIds, setLikedStayIds] = useState([]);

  useEffect(() => {
    // 배열이 아닌 값(서버 재시작 중 빈 응답 등)이 오면 그대로 넣지 않는다 - HomeTab과 동일한 이유로
    // likedItemIds.includes() 등이 null/undefined에서 터지는 걸 막기 위한 방어.
    getLikedPlaceIds().then((ids) => {
      const safeIds = Array.isArray(ids) ? ids : [];
      setLikedItemIds(safeIds);
      setLikedStayIds(safeIds);
    }).catch(() => {});
  }, []);

  // 2026-08-22 - 좋아요가 실제 서버에 저장되므로, 데이트/숙박 두 리스트 다 같은 place_likes를
  // 보는 거라 여기서 같이 갱신해준다(둘 다 갱신해도 카테고리가 안 겹쳐 화면엔 지장 없음).
  const applyLikeChange = (placeId, isAdding) => {
    const updater = (current) => (
      current.includes(placeId) ? current.filter((id) => id !== placeId) : [...current, placeId]
    );
    setLikedItemIds(updater);
    setLikedStayIds(updater);
    const call = isAdding ? likePlace(placeId) : unlikePlace(placeId);
    call.then(() => { if (isAdding) onStyleChanged?.(); }).catch(() => {});
  };

  const toggleLike = (placeId) => applyLikeChange(placeId, !likedItemIds.includes(placeId));
  const toggleStayLike = (placeId) => applyLikeChange(placeId, !likedStayIds.includes(placeId));

  return { likedItemIds, likedStayIds, toggleLike, toggleStayLike };
}
