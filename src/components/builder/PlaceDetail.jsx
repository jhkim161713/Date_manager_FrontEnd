import axios from "axios"
import { useEffect } from "react"
import { getToken } from "../../lib/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export function PlaceDetail({ props }) {

    const { setItemDetailsOpen, placeDetail } = props
    useEffect(() => {
        const fetchPlaceDetail = async () => {
            const token = getToken()
            try {
                const response = await axios.get(`${API_BASE_URL}/api/places/${placeDetail.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                console.log(response.data)
            } catch (e) {
                window.alert(`axios 에러${e.message}`)
            }
        }
        fetchPlaceDetail()
    }, [])




    return <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <div className="bg-white/80 backdrop-blur-sm w-full max-w-sm rounded-3xl p-6 shadow-xl border border-pink-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                    <h1 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-500 rounded-md font-semibold">details</span>
                        코스 상세 정보
                    </h1>
                </div>
                <div>
                    <h1>{placeDetail.name}</h1>
                    <p>{placeDetail.categori}</p>
                    <p>{placeDetail.address}</p>
                </div>

                <button onClick={() => { setItemDetailsOpen(false) }}>닫기</button>
            </div>
        </div>

    </>
}