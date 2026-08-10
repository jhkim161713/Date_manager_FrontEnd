import { useEffect, useState } from "react"
import { SectionTitle } from "../components/SectionTitle"
import { HScroll } from "../components/HScroll"
import { Builder } from "../data/builderData"
import { ContentCard } from "../components/ContentCard"
import { Badge } from "../components/Badge"
import { Map, MapInfoWindow } from "react-kakao-maps-sdk"
import { PLACE_DATA } from "../data/placeData"


export function BuilderTab() {

  const [data,setData] = useState([]);
  useEffect(()=>{
    setData(PLACE_DATA)
    data.map(m=>console.log(m))
  },[])
 
 

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">✨ 데이트 코스 빌더</h2>
      {/* <img style={{width: '100%',height: '450px'}}/> */}
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">추천 코스 목록</h1>
        {data.map((data)=>(<div key={data.id}>
        
          <h1>{data.name}</h1>
          <button className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all">코스보기</button>
          </div>
          
        ))}


      </div>
    </div>
    
  )
}