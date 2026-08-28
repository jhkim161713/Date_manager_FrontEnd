export function PlaceDetail({ props }) {

    const { setItemDetailsOpen, place } = props
    console.log(place)




    return <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

            <div className="bg-white/80 backdrop-blur-sm w-full max-w-sm rounded-3xl p-6 shadow-xl border border-pink-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                    <h1 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-500 rounded-md font-semibold">Create</span>
                        코스 상세 정보
                    </h1>
                </div>
                <div>
                    
                </div>


            </div>
        </div>

    </>
}