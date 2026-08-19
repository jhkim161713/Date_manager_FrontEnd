import { useEffect, useState } from "react"
import { SectionTitle } from "../components/SectionTitle"
import { HScroll } from "../components/HScroll"
import { Builder } from "../data/builderData"
import { ContentCard } from "../components/ContentCard"
import { Badge } from "../components/Badge"
import { Map, MapInfoWindow, MapMarker } from "react-kakao-maps-sdk"
import { COURSE_GROUP_DATA } from "../data/courseGroupData"


export function BuilderTab() {
  const [position,setPosition] = useState({});
  const [data,setData] = useState([]);
  const [showDetail,setShowDetail] = useState(null);
  useEffect(()=>{
    setData(COURSE_GROUP_DATA)
    setPosition({lat:33.450701,lng:126.570667})
    data.map(m=>console.log(m))
  },[])
 
  const showGroupItems=(index)=>{
    const detail=data[index]
    setShowDetail(detail)
    
  }


return (
    <div className="space-y-8 p-6 bg-rose-50/40 min-h-screen text-slate-700">
      {/* 메인 타이틀 영역 */}
      <div className="border-b border-rose-100 pb-4">
        <h2 className="text-2xl font-black text-rose-500 tracking-tight flex items-center gap-2">
          ✨ 데이트 코스 빌더
        </h2>
        <p className="text-xs text-rose-300 font-medium mt-1">나만의 달콤한 하루를 완성해보세요</p>
      </div>

      {/* 코스 그룹 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-4 bg-pink-400 rounded-full inline-block"></span>
          <h1 className="text-lg font-bold text-slate-800">코스 그룹</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((data,index)=>(
            <div 
              key={data.id} 
              className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100/60 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <h1 className="text-base font-bold text-slate-800 mb-3 line-clamp-1">{data.title}</h1>
              <button 
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all bg-gradient-to-r from-pink-300 via-rose-300 to-pink-400 text-white hover:opacity-95 shadow-sm shadow-pink-200 active:scale-[0.98] w-full" 
                onClick={()=>showGroupItems(index)}
              >
                코스보기
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* <img style={{width: '100%',height: '450px'}}/> */}
      
      {/* 상세보기 영역 */}
      {showDetail && (
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
              center={position}
              style={{width:'100%', height:"420px"}}
              className="rounded-2xl shadow-inner border border-pink-100 overflow-hidden"
            >      
              <MapMarker position={position}>
                <div style={{color:"#000"}} className="px-3 py-1 font-semibold text-xs text-rose-500 bg-white rounded-lg shadow-md border border-pink-200">
                  Hello World!
                </div>
              </MapMarker>
            </Map>
          </div>

          {/* 코스 내 장소 리스트 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider pl-1">Course Schedule</h3>
            <div className="space-y-2.5">
              {showDetail.places.map((place)=>(
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )} 
    </div>
  )      
}