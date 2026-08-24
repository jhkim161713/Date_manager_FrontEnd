import { useEffect, useState } from "react";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";

export function CourseDetail ({props}){
    const {showDetail, onMoveItem} = props
    const [position,setPosition] =useState({})
    const [paths,setPaths] = useState([]);
    const [distances,setDistances] = useState([]);
    
    if (!showDetail) return null
    

    useEffect(()=>{
        const pathes = showDetail.places.map(place=>({
            lat:place.latitude,
            lng:place.longitude
        }))
        setPosition(pathes[0])
        setPaths(pathes)
    },[showDetail])
   

    return (
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-pink-100 shadow-xl space-y-6 mt-8 animate-fade-in">
          <div className="flex items-center justify-between border-b border-pink-100 pb-3">
            <h1 className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-500 rounded-md font-semibold">Detail</span>
              
              데이트코스 상세보기
            </h1>
          </div>

          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 space-y-1">
            <p className="text-lg font-bold text-slate-800">{showDetail.title}</p>
            
          </div>

          {/* 카카오 지도 박스 */}
          <div className="flex justify-center w-full my-4">
            <Map
              center={position}
              style={{ width: '100%', height: "420px" }}
              className="rounded-2xl shadow-inner border border-pink-100 overflow-hidden"
              level={4}
               
              
            >
              {paths.map((coords)=>(
                <MapMarker
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
                        window.alert("공사중이에요")
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors cursor-pointer"

                    >
                      자세히 보기
                    </button>
                  </div>

                </div>
                
              ))}
            </div>
          </div>
        </div>
      )
}