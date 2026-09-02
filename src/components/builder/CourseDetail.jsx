import { useEffect, useState } from "react";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";
import { IS_ANDROID_APP } from "../../lib/platform";
import { PlaceDetail } from "./PlaceDetail";

export function CourseDetail({ props }) {
  const { showDetail, onMoveItem, onDeleteGroup, onOptimizeOrder } = props
  const [position, setPosition] = useState({})
  const [paths, setPaths] = useState([]);
  const [itemDetailsOpen, setItemDetailsOpen] = useState(false);
  const [placeDetail, setPlaceDetail] = useState(null)

  // index.html의 카카오맵 스크립트가 autoload=false라 kakao.maps.load()를 직접 호출해줘야
  // 지도가 초기화된다 - 이게 없어서 지도 영역이 계속 빈 박스로만 나왔었다(2026-08-25 발견).
  // useKakaoLoader는 index.html의 태그를 재사용하지 않고 자체적으로 새 <script>를 만드는데,
  // 그 기본 url이 프로토콜 상대경로("//dapi.kakao.com/...")라 안드로이드 웹뷰(origin이
  // http://localhost)에서는 http://dapi.kakao.com/...로 풀려 카카오 서버가 거부해서 계속
  // 실패/재시도만 반복했다(2026-09-01, 실기기 로그로 원인 확인 - index.html 쪽 스크립트
  // 태그는 이미 https로 고쳐뒀었는데 이 훅 호출부는 안 고쳐져 있었음). url을 명시해서 고정.
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
    libraries: ['services', 'clusterer'],
    url: 'https://dapi.kakao.com/v2/maps/sdk.js',
  });

  useEffect(() => {
    if (!showDetail) return;
    const pathes = showDetail.places.map(place => ({
      lat: place.latitude,
      lng: place.longitude
    }))
    setPosition(pathes[0])
    setPaths(pathes)
  }, [showDetail])

 const showPlaceDetail = (place) =>{
      
      setPlaceDetail(place)
      setItemDetailsOpen(true)
   }
  if (!showDetail) return null
  // 카카오맵 스크립트 로딩 중이거나 실패했을 때는 지도 영역만 비워두고 나머지(코스 목록 등)는
  // 정상 표시한다 - 지도 하나 때문에 상세보기 전체를 막을 필요는 없다.
  const mapReady = !loading && !error;

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-pink-100 shadow-xl space-y-6 mt-8 animate-fade-in">
      {/* flex-wrap(2026-09-01, 안드로이드 앱 전용) - 안드로이드 좁은 화면에서 제목+버튼이 한 줄에
              다 안 들어가면서 제목 글자("상세보기")가 어색하게 줄바꿈됐다. 버튼 쪽이 먼저 다음 줄로
              넘어가게. 웹은 원래대로 한 줄 유지. */}
      <div className={`flex items-center justify-between gap-y-2 border-b border-pink-100 pb-3 ${IS_ANDROID_APP ? 'flex-wrap' : ''}`}>
        <h1 className={`text-lg font-bold text-rose-600 flex items-center gap-2 ${IS_ANDROID_APP ? 'whitespace-nowrap' : ''}`}>
          <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-500 rounded-md font-semibold">Detail</span>

          데이트코스 상세보기
        </h1>
        <div className="flex items-center gap-2">
          {/* 코스 순서 자동 제안(동선 최적화, 2026-08-25 추가) - AI가 아니라 거리 계산
                  알고리즘이지만, 위치에서는 코스 만들기 이후 다듬는 흐름상 삭제 버튼 옆에 둔다. */}
          {showDetail.places?.length > 2 && (
            <button
              type="button"
              onClick={() => onOptimizeOrder?.(showDetail.id)}
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-pink-500 border border-pink-200 hover:bg-pink-50 transition-colors"
            >
              🚗 동선 최적화
            </button>
          )}
          {/* 등록된 코스 삭제 버튼(2026-08-25 추가) - 게시판 글 삭제 버튼과 같은 톤 */}
          <button
            type="button"
            onClick={() => onDeleteGroup?.(showDetail.id)}
            className="rounded-xl px-3 py-1.5 text-xs font-bold text-rose-500 border border-pink-200 hover:bg-rose-50 transition-colors"
          >
            🗑 삭제
          </button>
        </div>
      </div>

      <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 space-y-1">
        <p className="text-lg font-bold text-slate-800">{showDetail.title}</p>

      </div>

      {/* 카카오 지도 박스 */}
      <div className="flex justify-center w-full my-4">
        {mapReady && (
          <Map
            center={position}
            style={{ width: '100%', height: "420px" }}
            className="rounded-2xl shadow-inner border border-pink-100 overflow-hidden"
            level={4}
          >
            {paths.map((coords, index) => (
              <MapMarker
                key={`${coords.lat}-${coords.lng}-${index}`}
                position={coords}
              />
            ))}
            <Polyline
              path={paths}
              strokeWeight={5}
              strokeColor="#FF69B4"
              strokeOpacity={0.8}
              strokeStyle="solid"
            />
          </Map>
        )}
      </div>

      {/* 코스 내 장소 리스트 */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider pl-1">Course Schedule</h3>
        <div className="space-y-2.5">
          {showDetail.places.map((place, index) => (
            <div
              key={place.sequence}
              className="p-4 rounded-2xl bg-white border border-pink-100/80 hover:border-pink-300 transition-colors flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-500 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {place.sequence}
                </span>
                <div>
                  <h1 className="text-sm font-bold text-slate-800">{place.name}</h1>
                  <h1 className="text-xs text-pink-400 font-medium mt-0.5">{place.category}</h1>


                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveItem?.(showDetail.id, place.id, "up");
                    }}
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors cursor-pointer"
                    aria-label="위로 이동"
                  >
                    ▲
                  </button>
                )}
                {index < showDetail.places.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveItem?.(showDetail.id, place.id, "down");
                    }}
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors cursor-pointer"
                    aria-label="아래로 이동"
                  >
                    ▼
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // 부모 div의 클릭 이벤트 전파 방지
                    showPlaceDetail(place)
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors shrink-0 cursor-pointer"

                >
                  자세히 보기
                </button>
              </div>

            </div>

          ))}
        </div>
      </div>
      {itemDetailsOpen && <PlaceDetail
        props={{ setItemDetailsOpen, placeDetail }}

      />}
    </div>
  )
}