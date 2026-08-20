import { useEffect, useState } from "react";
import { Map } from "react-kakao-maps-sdk";

export function CourseDetail ({data,showDetail}){
    if (!showDetail){return null}
    const [position,setPosition] =useState({})
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
            <p className="text-sm text-rose-400 font-medium">{showDetail.subtitle}</p>
          </div>

          {/* 카카오 지도 박스 */}
          <div className="flex justify-center w-full my-4">
            <Map
              center={{ lat: 33.450701, lng: 126.570667 }}
              style={{ width: '100%', height: "420px" }}
              className="rounded-2xl shadow-inner border border-pink-100 overflow-hidden"
            >
            </Map>
          </div>

          {/* 코스 내 장소 리스트 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider pl-1">Course Schedule</h3>
            <div className="space-y-2.5">
              {showDetail.places.map((place, index) => (
                <div
                  key={place.step}
                  className="p-4 rounded-2xl bg-white border border-pink-100/80 hover:border-pink-300 transition-colors flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-500 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {place.step}
                    </span>
                    <div>
                      <h1 className="text-sm font-bold text-slate-800">{place.name}</h1>
                      <h1 className="text-xs text-pink-400 font-medium mt-0.5">{place.category}</h1>


                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // 부모 div의 클릭 이벤트 전파 방지

                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                    
                  >
                    자세히 보기
                  </button>
                  
                </div>
                
              ))}
            </div>
          </div>
        </div>
      )
}