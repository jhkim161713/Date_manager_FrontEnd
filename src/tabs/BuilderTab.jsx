import { useState } from "react"
import { SectionTitle } from "../components/SectionTitle"
import { HScroll } from "../components/HScroll"
import { Builder } from "../data/builderData"
import { ContentCard } from "../components/ContentCard"
import { Badge } from "../components/Badge"
import { Map, MapMarker} from "react-kakao-maps-sdk"

export function BuilderTab() {


  

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">✨ 데이트 코스 빌더</h2>
      <section className="w-full bg-white rounded-2xl p-6 shadow-sm border border-pink-50 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-lg">추천 장소</h3>
          <button className="text-xs text-pink-400 hover:underline">전체</button>
        </div>
        <div className="space-y-3">
          {/* 카드1 */}
          <div className="">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-pink-400 text-center">1위</span>
            </div>
            <h4 className="font-semibold text-sm text-gray-800">장소 1</h4>
            <p className="text-xs text-gray-400 mt-0.5">평점,가격</p>
          </div >
        </div>

      </section>


      {/* <img  style={{ width: "100%", height: "360px" }}/> */}
      {/* <Map
        center={{ lat: 36.2683, lng: 127.6358 }}
        style={{ width: "100%", height: "360px" }}
        level={3}
      ></Map> */}
    </div>

    
  )
}