import { useEffect, useState } from 'react';
import { addPlaceToCourse } from '../lib/api';
import { BUILDER_STORAGE_KEY, CURATION_CART_STORAGE_KEY } from '../data/curationData';

// 코스 빌더 담기함(2026-08-20) - place 객체를 통째로 담아서, 카테고리를 바꾸거나 이 탭을 나갔다
// 와도(다른 탭으로 이동해 CurationTab이 언마운트됐다 다시 마운트돼도) localStorage에서 그대로
// 복원된다. id만 들고 있다가 화면에 보이는 목록에서 다시 찾아 채우는 방식(placeCache)은 탭을
// 나갔다 오면 그 캐시까지 초기화돼서 목록이 텅 비어 보이는 문제가 있었다 - place 통째로 저장하면
// 그 문제가 안 생긴다. 로그아웃 시점에만 App.jsx에서 이 저장값을 지운다.
export function useBuilderCart({ onStyleChanged, onOpenBuilder, showFeedback }) {
  const [builderItems, setBuilderItems] = useState(() => {
    try {
      const raw = localStorage.getItem(CURATION_CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem(CURATION_CART_STORAGE_KEY, JSON.stringify(builderItems));
  }, [builderItems]);
  // 담기함 목록을 펼쳐서 개별 삭제할 수 있게 하는 토글(2026-08-20).
  const [showCart, setShowCart] = useState(false);

  const toggleBuilderItem = (place) => {
    if (builderItems.some((item) => item.id === place.id)) {
      setBuilderItems((current) => current.filter((item) => item.id !== place.id));
      showFeedback('코스 후보에서 뺐어요');
      return;
    }

    if (builderItems.length >= 5) {
      showFeedback('코스 후보는 최대 5곳까지 담을 수 있어요');
      return;
    }

    setBuilderItems((current) => [...current, place]);
    showFeedback('코스 빌더 후보에 담았어요');
    // 담기함 자체는 서버 저장 없이 로컬 state로만 유지하되, "담았다"는 의사표현 신호만 UserStyle
    // 실시간 갱신 엔진에 넘긴다(2026-08-22). 뺄 때는 호출 안 함 - 신호가 왜곡되지 않게.
    addPlaceToCourse(place.id).then(() => onStyleChanged?.()).catch(() => {});
  };

  // 담기함 목록에서 개별 항목을 뺄 때(2026-08-20, "잘못 담은 걸 삭제할 수 있어야 한다") 쓴다 -
  // toggleBuilderItem은 카드에서 다시 눌러 빼는 것과 같은 동작이라 재사용 가능.
  const removeFromCart = (placeId) => {
    setBuilderItems((current) => current.filter((item) => item.id !== placeId));
  };

  const sendToBuilder = () => {
    if (!builderItems.length) {
      showFeedback('먼저 마음에 드는 장소를 담아 주세요');
      return;
    }

    const builderQueue = builderItems.map((place) => ({
      id: `curation:${place.id}`,
      source: 'curation',
      sourceId: place.id,
      title: place.name,
      description: place.subCategory || place.parentCategory,
      category: place.parentCategory,
      area: place.address,
      image: place.imageUrl,
      match: place.matchScore,
    }));

    try {
      localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(builderQueue));
      window.dispatchEvent(new CustomEvent('date-manager:builder-queue-updated', {
        detail: builderQueue,
      }));
      showFeedback(`코스 빌더용으로 ${builderQueue.length}곳을 저장했어요`);
      // 빌더로 넘겼으면 큐레이션 쪽 담기함은 비워야 한다 - 안 비우면 다시 큐레이션 탭에
      // 돌아왔을 때 이미 보낸 장소들이 "코스 후보 N곳을 골랐어요"로 계속 남아있어서
      // 보낸 적 없는 것처럼 보인다(2026-08-25 발견).
      setBuilderItems([]);
      setShowCart(false);
      onOpenBuilder?.(builderQueue);
    } catch {
      showFeedback('장소를 저장하지 못했어요. 다시 시도해 주세요');
    }
  };

  return { builderItems, showCart, setShowCart, toggleBuilderItem, removeFromCart, sendToBuilder };
}
