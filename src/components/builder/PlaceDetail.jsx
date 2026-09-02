import axios from "axios"
import { useEffect, useState } from "react"
import { getToken } from "../../lib/api";
import defaultGalleryImg from '../../imports/default_bg.png'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export function PlaceDetail({ props }) {

    const { setItemDetailsOpen, placeDetail } = props
    const [placeData, setPlaceData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => {
        const fetchPlaceDetail = async () => {
            const token = getToken()
            setIsLoading(true)
            try {
                const response = await axios.get(`${API_BASE_URL}/api/places/${placeDetail.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }

                })
                setPlaceData(response.data)
                console.log(response.data.imageUrl)
            } catch (e) {
                window.alert(`axios 에러${e.message}`)
            } finally {
                setIsLoading(false)
            }
        }
        fetchPlaceDetail()
        return () => {
            setPlaceData(null)
        }
    }, [])




return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-md">
        <div className="bg-white/90 backdrop-blur-md w-full max-w-lg rounded-3xl p-7 shadow-2xl shadow-rose-100/50 border border-pink-100/80 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          
          {/* 헤더 영역 */}
          <div className="flex items-center justify-between border-b border-pink-100/60 pb-3.5">
            <h1 className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 bg-rose-100/80 text-rose-500 rounded-full font-semibold border border-rose-200/50">
                details
              </span>
              코스 상세 정보
            </h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-300 border-t-transparent" />
            </div>
          ) : placeData != null ? (
            <div key={placeData.id} className="flex items-start gap-5 p-5 bg-gradient-to-br from-pink-50/70 to-rose-50/30 rounded-2xl border border-pink-100/70 shadow-sm">
              
              {/* 이미지 영역 */}
              <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden shadow-sm border-2 border-white bg-pink-50">
                <img
                  src={placeData.imageUrl || defaultGalleryImg}
                  alt={placeData.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = defaultGalleryImg;
                  }}
                />
              </div>

              {/* 정보 영역 */}
              <div className="flex flex-col items-start gap-2 min-w-0 flex-1">
                <div className="w-full space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block px-2.5 py-0.5 text-xs font-medium text-rose-500 bg-rose-100/80 rounded-md border border-rose-200/40">
                      {placeData.category}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 leading-snug break-words w-full">
                    {placeData.name}
                  </h2>
                </div>

                {/* 도로명 주소 영역 */}
                {(placeData.address || placeData.adrres) && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-white/80 px-2.5 py-1 rounded-lg border border-pink-100/80 w-full">
                    <svg className="w-3.5 h-3.5 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate text-gray-600 font-medium">
                      {placeData.address || placeData.adrres}
                    </span>
                  </div>
                )}

                {/* 게이지바 목록 */}
                <div className="w-full space-y-1.5 mt-1 pt-1 border-t border-pink-100/50">
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500 mb-0.5">
                      <span>심미성 (Aesthetic)</span>
                      <span className="text-rose-500 font-semibold">{placeData.scoreAesthetic ?? 0}%</span>
                    </div>
                    <div className="w-full bg-pink-100/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${placeData.scoreAesthetic ?? 0}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500 mb-0.5">
                      <span>깊이감 (Depth)</span>
                      <span className="text-rose-500 font-semibold">{placeData.scoreDepth ?? 0}%</span>
                    </div>
                    <div className="w-full bg-pink-100/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${placeData.scoreDepth ?? 0}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500 mb-0.5">
                      <span>활동성 (Energy)</span>
                      <span className="text-rose-500 font-semibold">{placeData.scoreEnergy ?? 0}%</span>
                    </div>
                    <div className="w-full bg-pink-100/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${placeData.scoreEnergy ?? 0}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500 mb-0.5">
                      <span>몰입도 (Immersion)</span>
                      <span className="text-rose-500 font-semibold">{placeData.scoreImmersion ?? 0}%</span>
                    </div>
                    <div className="w-full bg-pink-100/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${placeData.scoreImmersion ?? 0}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500 mb-0.5">
                      <span>분위기 (Vibe)</span>
                      <span className="text-rose-500 font-semibold">{placeData.scoreVibe ?? 0}%</span>
                    </div>
                    <div className="w-full bg-pink-100/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-pink-400 to-rose-400 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${placeData.scoreVibe ?? 0}%` }} 
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center text-rose-300 py-10 text-sm font-medium">
              장소 데이터를 불러오지 못했어요...
            </div>
          )}

          <button
            onClick={() => { setItemDetailsOpen(false) }}
            className="w-full py-3 bg-gradient-to-r from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 text-rose-500 font-bold rounded-2xl transition-all shadow-sm active:scale-[0.99] text-sm border border-pink-200/50"
          >
            닫기
          </button>
        </div>
      </div>
    </>
  );
}