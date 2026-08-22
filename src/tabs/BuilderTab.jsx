import { useEffect, useState } from "react"
import { SectionTitle } from "../components/SectionTitle"
import { HScroll } from "../components/HScroll"
import { Builder } from "../data/builderData"
import { ContentCard } from "../components/ContentCard"

import { Map, MapInfoWindow, MapMarker } from "react-kakao-maps-sdk"
import { COURSE_GROUP_DATA } from "../data/courseGroupData"
import { CourseDetail } from "../components/builder/CourseDetail"


export function BuilderTab() {
  const [data, setData] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  
  useEffect(() => {
    setData(COURSE_GROUP_DATA)
  }, [])

  const showGroupItems = (index) => {
    const detail = data[index]
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
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-semibold text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            코스그룹 만들기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((data, index) => (
            <div
              key={data.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100/60 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <h1 className="text-base font-bold text-slate-800 mb-3 line-clamp-1">{data.title}</h1>
              <button
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all bg-gradient-to-r from-pink-300 via-rose-300 to-pink-400 text-white hover:opacity-95 shadow-sm shadow-pink-200 active:scale-[0.98] w-full"
                onClick={() => showGroupItems(index)}
              >
                코스보기
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* <img style={{width: '100%',height: '450px'}}/> */}

      {/* 상세보기 영역 */}
      {showDetail && 
      <CourseDetail
      props={{showDetail}}
      />}
    </div>
  )
}