import { useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { SectionTitle } from '../components/SectionTitle';
import {
  BUILDER_STORAGE_KEY,
  CURATION_ITEMS,
  CURATION_MODES,
} from '../data/curationData';

const formatWon = (price) => (price === 0 ? '무료' : `${price.toLocaleString('ko-KR')}원`);

export function CuriationTab({ onOpenBuilder }) {
  const [mode, setMode] = useState('passive');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('match');
  const [builderItemIds, setBuilderItemIds] = useState([]);
  const [likedItemIds, setLikedItemIds] = useState([]);
  const [feedback, setFeedback] = useState('');

  const modeInfo = CURATION_MODES[mode];

  const showFeedback = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2200);
  };

  const filteredItems = useMemo(() => {
    const nextItems = CURATION_ITEMS.filter((item) => (
      item.mode === mode && (category === 'all' || item.category === category)
    ));

    return [...nextItems].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'duration') return a.duration - b.duration;
      return b.match - a.match;
    });
  }, [category, mode, sortBy]);

  const builderItems = builderItemIds
    .map((id) => CURATION_ITEMS.find((item) => item.id === id))
    .filter(Boolean);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setCategory('all');
  };

  const toggleBuilderItem = (itemId) => {
    if (builderItemIds.includes(itemId)) {
      setBuilderItemIds((current) => current.filter((id) => id !== itemId));
      showFeedback('코스 후보에서 뺐어요');
      return;
    }

    if (builderItemIds.length >= 5) {
      showFeedback('코스 후보는 최대 5곳까지 담을 수 있어요');
      return;
    }

    setBuilderItemIds((current) => [...current, itemId]);
    showFeedback('코스 빌더 후보에 담았어요');
  };

  const toggleLike = (itemId) => {
    setLikedItemIds((current) => (
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    ));
  };

  const sendToBuilder = () => {
    if (!builderItems.length) {
      showFeedback('먼저 마음에 드는 장소를 담아 주세요');
      return;
    }

    const builderQueue = builderItems.map((item) => ({
      id: `curation:${item.id}`,
      source: 'curation',
      sourceId: item.id,
      title: item.title,
      description: item.subtitle,
      category: item.category,
      area: item.location,
      price: item.price,
      duration: item.duration,
      image: item.img,
      match: item.match,
      mode: item.mode,
    }));

    try {
      localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(builderQueue));
      window.dispatchEvent(new CustomEvent('date-manager:builder-queue-updated', {
        detail: builderQueue,
      }));
      showFeedback(`코스 빌더용으로 ${builderQueue.length}곳을 저장했어요`);
      onOpenBuilder?.(builderQueue);
    } catch {
      showFeedback('장소를 저장하지 못했어요. 다시 시도해 주세요');
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <SectionTitle sub="오늘의 에너지에 맞춰 우리에게 어울리는 장소를 골라보세요">
        데이트 큐레이션
      </SectionTitle>

      <section
        className="relative overflow-hidden rounded-[28px] px-5 py-6 md:px-7"
        style={{
          background: modeInfo.gradient,
          border: '1.5px solid #f0dce2',
          boxShadow: '0 10px 28px rgba(97, 66, 77, 0.06)',
        }}
      >
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/35" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-extrabold"
              style={{ color: modeInfo.accent }}
            >
              {modeInfo.emoji} TODAY&apos;S DATE MOOD
            </span>
            <h3 className="font-display mt-3 text-2xl font-bold" style={{ color: '#45343d' }}>
              {modeInfo.title}
            </h3>
            <p className="mt-1.5 max-w-xl text-xs leading-5" style={{ color: '#8e7882' }}>
              {modeInfo.description}
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 p-1.5 shadow-sm" role="group" aria-label="데이트 모드 선택">
            {Object.values(CURATION_MODES).map((item) => {
              const selected = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeMode(item.id)}
                  className="rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all"
                  style={{
                    background: selected ? item.accent : 'transparent',
                    color: selected ? 'white' : '#947f88',
                    boxShadow: selected ? `0 5px 13px ${item.accent}33` : undefined,
                  }}
                >
                  {item.emoji} {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {modeInfo.categories.map((item) => {
            const selected = category === item.id;
            const count = CURATION_ITEMS.filter((curation) => (
              curation.mode === mode && curation.category === item.id
            )).length;

            return (
              <button
                key={`${mode}-${item.id}`}
                type="button"
                onClick={() => setCategory(selected ? 'all' : item.id)}
                className="group flex items-center gap-3 rounded-2xl p-3 text-left transition-all hover:-translate-y-0.5 md:p-4"
                style={{
                  background: selected ? 'white' : 'rgba(255,255,255,0.62)',
                  border: `1.5px solid ${selected ? `${item.color}75` : 'rgba(255,255,255,0.9)'}`,
                  boxShadow: selected ? `0 7px 18px ${item.color}1f` : undefined,
                }}
              >
                <span
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-lg transition-transform group-hover:scale-110"
                  style={{ background: item.background }}
                >
                  {item.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-1">
                    <strong className="text-xs" style={{ color: selected ? item.color : '#4d3b44' }}>{item.label}</strong>
                    <small className="text-[9px] font-bold" style={{ color: '#b19fa6' }}>{count}</small>
                  </span>
                  <span className="mt-0.5 block truncate text-[9px]" style={{ color: '#a18d95' }}>{item.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {builderItems.length > 0 && (
        <section
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5"
          style={{ background: '#fff7f7', border: '1.5px solid #f6d4dc' }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base shadow-sm">🗺️</span>
            <div>
              <p className="text-xs font-extrabold" style={{ color: '#513e47' }}>
                코스 후보 {builderItems.length}곳을 골랐어요
              </p>
              <p className="mt-0.5 max-w-md truncate text-[10px]" style={{ color: '#a08b94' }}>
                {builderItems.map((item) => item.title).join(' · ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={sendToBuilder}
            className="rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #ff6b8a, #c98fd4)', boxShadow: '0 5px 14px rgba(255,107,138,0.2)' }}
          >
            코스 빌더로 보내기 →
          </button>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold" style={{ color: '#45343d' }}>
              {category === 'all'
                ? `${modeInfo.label} 전체`
                : modeInfo.categories.find((item) => item.id === category)?.label}
            </h3>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ background: '#fff0f3', color: '#e8486b' }}>
              {filteredItems.length}곳
            </span>
            {category !== 'all' && (
              <button
                type="button"
                onClick={() => setCategory('all')}
                className="text-[10px] font-bold underline underline-offset-2"
                style={{ color: '#9f8b94' }}
              >
                전체 보기
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-xl bg-white px-3 py-2 text-[10px] font-bold outline-none"
            style={{ color: '#75616a', border: '1px solid #eadde1' }}
            aria-label="큐레이션 정렬"
          >
            <option value="match">취향 매칭순</option>
            <option value="price">가격 낮은순</option>
            <option value="duration">짧은 코스순</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredItems.map((item) => {
            const inBuilder = builderItemIds.includes(item.id);
            const liked = likedItemIds.includes(item.id);

            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[24px] bg-white transition-all hover:-translate-y-1"
                style={{ border: '1.5px solid #f0dce2', boxShadow: '0 5px 18px rgba(89, 58, 70, 0.06)' }}
              >
                <div className="relative h-40 overflow-hidden bg-rose-50">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold" style={{ color: '#e8486b', backdropFilter: 'blur(6px)' }}>
                    ♥ {item.match}% 매칭
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleLike(item.id)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm transition-transform hover:scale-110"
                    style={{ color: liked ? '#e8486b' : '#a9979e' }}
                    aria-label={`${item.title} 찜하기`}
                  >
                    {liked ? '♥' : '♡'}
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge color={item.tagColor} bg={item.tagBg}>{item.tag}</Badge>
                    <span className="text-[9px] font-bold" style={{ color: '#aa969e' }}>{item.duration}분</span>
                  </div>
                  <h4 className="mt-2.5 truncate text-sm font-extrabold" style={{ color: '#43323a' }}>{item.title}</h4>
                  <p className="mt-1 truncate text-[10px]" style={{ color: '#9f8992' }}>{item.subtitle}</p>

                  <div className="mt-3 flex items-center justify-between text-[10px]">
                    <span style={{ color: '#8f7b84' }}>📍 {item.location}</span>
                    <strong style={{ color: '#66515a' }}>{formatWon(item.price)} <small className="font-normal text-stone-400">/ 2인</small></strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBuilderItem(item.id)}
                    className="mt-4 w-full rounded-xl py-2.5 text-[11px] font-extrabold transition-all"
                    style={{
                      background: inBuilder ? '#f3edef' : '#fff0f3',
                      color: inBuilder ? '#846f78' : '#e8486b',
                      border: `1px solid ${inBuilder ? '#e8dde1' : '#f6cdd7'}`,
                    }}
                  >
                    {inBuilder ? '✓ 코스 후보에 담김' : '+ 코스 빌더에 담기'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div
        aria-live="polite"
        className={`fixed bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-xs font-extrabold text-white shadow-lg transition-all ${feedback ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        style={{ background: '#4f3d46' }}
      >
        ✓ {feedback}
      </div>
    </div>
  );
}
