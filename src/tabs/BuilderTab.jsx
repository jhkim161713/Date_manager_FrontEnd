import { useEffect, useState } from "react"
import { SectionTitle } from "../components/SectionTitle"
import { Map, MapMarker } from "react-kakao-maps-sdk"
import { getCourseGroups, deleteCourseGroup, removeCourseItem, moveCourseItem } from "../lib/api"

// 2026-08-20: 정적 더미 데이터(courseGroupData.js) 대신 실제 백엔드 코스빌더 API
// (feature/course-place-integration 브랜치)를 불러온다 - 큐레이션 탭에서 담은 place가 실제로
// 여기까지 오는지 확인하기 위한 최소 연동. 라이브 모드(무드 스위처 등)는 아직 없음.
export function BuilderTab() {
  const [position, setPosition] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetail, setShowDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadGroups = async () => {
      setLoading(true);
      setError('');
      try {
        const groups = await getCourseGroups();
        if (!cancelled) setData(groups);
      } catch (e) {
        if (!cancelled) setError(e.message || '코스 목록을 불러오지 못했어요');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadGroups();
    return () => { cancelled = true; };
  }, [])

  const openGroup = (detail) => {
    setShowDetail(detail)
    const first = detail.items?.[0]
    setPosition(first?.latitude != null && first?.longitude != null
      ? { lat: first.latitude, lng: first.longitude }
      : null)
  }

  // "코스보기"를 다시 누르면 접히게(2026-08-20, "지도를 펼치면 다시 접는 기능이 있어야 할 것 같다") -
  // 같은 그룹을 또 누르면 닫고, 다른 그룹을 누르면 그걸로 바꿔 연다.
  const showGroupItems = (index) => {
    const detail = data[index]
    if (showDetail?.id === detail.id) {
      setShowDetail(null)
      setPosition(null)
      return
    }
    openGroup(detail)
  }

  const closeDetail = () => {
    setShowDetail(null)
    setPosition(null)
  }

  // 코스 그룹 통째로 삭제(2026-08-20, "코스를 삭제하는 기능이 있어야 할 것 같아").
  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`"${group.title}" 코스를 삭제할까요? 담긴 장소도 모두 함께 지워져요.`)) return
    try {
      await deleteCourseGroup(group.id)
      setData((current) => current.filter((g) => g.id !== group.id))
      if (showDetail?.id === group.id) closeDetail()
    } catch (e) {
      setError(e.message || '코스를 삭제하지 못했어요')
    }
  }

  // 상세보기에 담긴 장소 하나만 빼기(2026-08-20, "한두군데를 빼는 기능이 들어가야 할 것 같아").
  const handleRemoveItem = async (item) => {
    try {
      const updated = await removeCourseItem(showDetail.id, item.itemId)
      setShowDetail(updated)
      setData((current) => current.map((g) => (g.id === updated.id ? updated : g)))
    } catch (e) {
      setError(e.message || '장소를 빼지 못했어요')
    }
  }

  // 담긴 장소 순서 바꾸기(2026-08-20, "순서를 바꾸는 기능이 들어가야 할 것 같아").
  const handleMoveItem = async (item, direction) => {
    try {
      const updated = await moveCourseItem(showDetail.id, item.itemId, direction)
      setShowDetail(updated)
      setData((current) => current.map((g) => (g.id === updated.id ? updated : g)))
    } catch (e) {
      setError(e.message || '순서를 바꾸지 못했어요')
    }
  }


  return (
    <div className="space-y-5 bg-rose-50/40 min-h-screen text-slate-700">
      {/* 메인 타이틀 영역 - 다른 탭들과 같은 공용 컴포넌트로 통일(2026-08-20). 팀원이 만든 자체
          마크업엔 이 SectionTitle을 border-b+pb-4로 한 번 더 감싸는 wrapper가 있었는데, 큐레이션/
          파트너링크는 그런 wrapper 없이 SectionTitle이 바로 놓여 있어서 코스빌더만 제목 아래 여백이
          16px 더 크고 구분선까지 있었다 - 다른 탭과 똑같이 wrapper를 걷어냄. */}
      <SectionTitle sub="나만의 달콤한 하루를 완성해보세요">🛣️ 데이트 코스 빌더</SectionTitle>

      {/* 코스 그룹 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-4 bg-pink-400 rounded-full inline-block"></span>
          <h1 className="text-lg font-bold text-slate-800">코스 그룹</h1>
          {/* 팀원(kimhan) feature/builder 브랜치 9997d2c에서 가져옴 - 아직 클릭 핸들러 없는
              스텁이라 currently no-op. 빈 코스 그룹을 직접 만드는 플로우는 이후 추가 예정. */}
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-semibold text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            코스그룹 만들기
          </button>
        </div>

        {loading && <p className="text-sm text-slate-400">불러오는 중...</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {!loading && !error && data.length === 0 && (
          <p className="text-sm text-slate-400">
            아직 담긴 코스가 없어요. 큐레이션 탭에서 장소를 담고 "코스 빌더로 보내기"를 눌러보세요.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((group, index) => (
            <div
              key={group.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100/60 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <h1 className="text-base font-bold text-slate-800 mb-1 line-clamp-1">{group.title}</h1>
              <p className="text-xs text-rose-300 font-medium mb-3">{group.items?.length ?? 0}곳 담김</p>
              <div className="flex items-center gap-2">
                <button
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all bg-gradient-to-r from-pink-300 via-rose-300 to-pink-400 text-white hover:opacity-95 shadow-sm shadow-pink-200 active:scale-[0.98]"
                  onClick={() => showGroupItems(index)}
                >
                  {showDetail?.id === group.id ? '코스 접기' : '코스보기'}
                </button>
                <button
                  className="py-2.5 px-3 rounded-2xl text-sm font-bold transition-all bg-rose-50 text-rose-400 hover:bg-rose-100 active:scale-[0.98]"
                  onClick={() => handleDeleteGroup(group)}
                  aria-label={`${group.title} 삭제`}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상세보기 영역 */}
      {showDetail && (
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-pink-100 shadow-xl space-y-6 mt-8 animate-fade-in">
          <div className="flex items-center justify-between border-b border-pink-100 pb-3">
            <h1 className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-500 rounded-md font-semibold">Detail</span>
              데이트코스 상세보기
            </h1>
            <button
              className="text-xs font-bold text-rose-300 hover:text-rose-500 transition-colors px-2 py-1"
              onClick={closeDetail}
            >
              ▲ 접기
            </button>
          </div>

          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 space-y-1">
            <p className="text-lg font-bold text-slate-800">{showDetail.title}</p>
            <p className="text-sm text-rose-400 font-medium">{showDetail.items?.length ?? 0}곳으로 이루어진 코스</p>
          </div>

          {/* 카카오 지도 박스 - 실제 첫 장소 좌표를 중심으로(2026-08-20, 예전엔 제주도 좌표 하드코딩) */}
          {position && (
            <div className="flex justify-center w-full my-4">
              <Map
                center={position}
                style={{ width: '100%', height: "420px" }}
                className="rounded-2xl shadow-inner border border-pink-100 overflow-hidden"
              >
                {showDetail.items.filter(p => p.latitude != null && p.longitude != null).map((place) => (
                  <MapMarker key={place.itemId} position={{ lat: place.latitude, lng: place.longitude }}>
                    <div style={{ color: "#000" }} className="px-3 py-1 font-semibold text-xs text-rose-500 bg-white rounded-lg shadow-md border border-pink-200">
                      {place.sequence}. {place.placeName}
                    </div>
                  </MapMarker>
                ))}
              </Map>
            </div>
          )}

          {/* 코스 내 장소 리스트 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider pl-1">Course Schedule</h3>
            <div className="space-y-2.5">
              {showDetail.items.length === 0 && (
                <p className="text-sm text-slate-400 px-1">아직 담긴 장소가 없어요.</p>
              )}
              {showDetail.items.map((place, itemIndex) => (
                <div
                  key={place.itemId}
                  className="p-4 rounded-2xl bg-white border border-pink-100/80 hover:border-pink-300 transition-colors flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-500 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {place.sequence}
                    </span>
                    <div>
                      <h1 className="text-sm font-bold text-slate-800">{place.placeName}</h1>
                      <h1 className="text-xs text-pink-400 font-medium mt-0.5">{place.category}</h1>
                    </div>
                  </div>
                  {/* 순서 변경/빼기(2026-08-20) - 맨 위/맨 아래에서는 해당 방향 버튼을 비활성화 */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="w-7 h-7 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                      onClick={() => handleMoveItem(place, 'up')}
                      disabled={itemIndex === 0}
                      aria-label={`${place.placeName} 위로`}
                    >
                      ▲
                    </button>
                    <button
                      className="w-7 h-7 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                      onClick={() => handleMoveItem(place, 'down')}
                      disabled={itemIndex === showDetail.items.length - 1}
                      aria-label={`${place.placeName} 아래로`}
                    >
                      ▼
                    </button>
                    <button
                      className="ml-1 px-2 h-7 rounded-full text-xs font-bold text-rose-400 hover:bg-rose-50"
                      onClick={() => handleRemoveItem(place)}
                      aria-label={`${place.placeName} 빼기`}
                    >
                      ✕ 빼기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
