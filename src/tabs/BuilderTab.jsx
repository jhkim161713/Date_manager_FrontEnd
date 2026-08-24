import { useEffect, useState } from "react"

import { COURSE_GROUP_DATA } from "../data/courseGroupData"
import { CourseDetail } from "../components/builder/CourseDetail"
import axios from "axios"
import { getToken } from "../lib/api"
import { BUILDER_STORAGE_KEY } from "../data/curationData"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function BuilderTab() {

  const [data, setData] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  
  const [builderQueue, setBuilderQueue] = useState([]);
  const [isGroupMakerOpen, setIsGroupMakerOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');

  //큐레이션 탭에서 전송한 데이터를 마운트시에 셋팅해주는 코드
  useEffect(() => {
    const savedData = localStorage.getItem(BUILDER_STORAGE_KEY);

    if (savedData) {
      setBuilderQueue(JSON.parse(savedData));
    }


    const handleStorage = (event) => {
      if (event.key !== BUILDER_STORAGE_KEY) {
        return;
      }

      if (!event.newValue) {
        setBuilderQueue([]);
        return;
      }

      setBuilderQueue(JSON.parse(event.newValue));
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);


  useEffect(() => {
    const getCourseGroups = async () =>{
      try{
        const token = getToken();

        const response = await axios.get(`${API_BASE_URL}/api/course/groups`,{
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setData(response.data)
      }catch(error){
        window.alert("axios error")
      }
    }
    getCourseGroups();
    
  }, [data])

  const showGroupItems = (index) => {
    const detail = data[index]
    setShowDetail(detail)

  }


  const handleOpenGroupMaker = () => {
    if (builderQueue.length === 0) {
      alert("먼저 장소를 담아주세요.");
      return;
    }
    setCourseTitle(""); 
    setIsGroupMakerOpen(true);

  }

  const handleCreateCourseGroup = async (e) => {
    e.preventDefault();

    if (!courseTitle.trim()) {
      alert("코스 이름을 입력해 주세요!");
      return;
    }
    try {
      const token = getToken();
      await axios.post(
        `${API_BASE_URL}/api/course/groups`,
        {
          title: courseTitle,
          placeIds: builderQueue.map((item) => item.sourceId)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("코스 생성이 완료되었습니다!");
      setIsGroupMakerOpen(false);
      setCourseTitle("");
      setBuilderQueue([]);
      localStorage.removeItem(BUILDER_STORAGE_KEY);

    } catch (error) {
      console.error("생성 실패:", error);
      alert("코스 생성 중 오류가 발생했습니다.");
    }
  }

  // 코스 상세보기에서 장소 순서를 위/아래로 한 칸 옮긴다.
  const handleMoveCourseItem = async (groupId, placeId, direction) => {
    try {
      const token = getToken();
      await axios.patch(
        `${API_BASE_URL}/api/course/groups/${groupId}/items/${placeId}/move`,
        { direction },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const response = await axios.get(`${API_BASE_URL}/api/course/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
      setShowDetail(response.data.find((group) => group.id === groupId) ?? null);
    } catch (error) {
      console.error("순서 변경 실패:", error);
      alert("순서 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-8 p-6 bg-rose-50/40 min-h-screen text-slate-700">
      {/* 메인 타이틀 영역 */}
      <div className="border-b border-rose-100 pb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-extrabold text-rose-500">
          ✨ COURSE BUILDER
        </span>
        <h2 className="font-display mt-2 text-3xl font-bold leading-[1.25] text-rose-500 tracking-tight">
          데이트 코스 빌더
        </h2>
        <p className="mt-1 text-xs text-rose-300 font-medium">나만의 달콤한 하루를 완성해보세요</p>
      </div>
      {builderQueue.length === 0 ? (
        data.length === 0 && (<div>

        <h2> 담은 코스가 없어요 큐레이션 탭에서 코스를 담아보세요!</h2>

        </div>)
      ) : (
        <>
          {builderQueue.map((queue) => (
            <div
              key={queue.sourceId}
              className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-rose-100/80 shadow-sm hover:border-rose-300 hover:shadow transition-all"
            >
              {/* 좌측: 카테고리 태그 + 제목 */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium text-rose-600 bg-rose-50 rounded-md border border-rose-200/60">
                  {queue.category}
                </span>

                <span className="text-sm font-semibold text-gray-800 truncate">
                  {queue.title}
                </span>
              </div>

              {/* 우측: 주소 */}
              <span className="shrink-0 text-xs text-rose-400 font-normal truncate max-w-[180px] sm:max-w-[240px]">
                {queue.area}
              </span>
            </div>
          ))}

          {/* 목록 아래에 버튼 하나 */}
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition"
            onClick={handleOpenGroupMaker}
          >
            코스 만들기
          </button>
        </>
      )}
      {/* 코스 그룹 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-4 bg-pink-400 rounded-full inline-block"></span>
          <h1 className="text-lg font-bold text-slate-800">코스 그룹</h1>

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

      

      {/* 상세보기 영역 */}
      {showDetail &&
        <CourseDetail
          props={{ showDetail, onMoveItem: handleMoveCourseItem }}
        />}



      {isGroupMakerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              ✨ 코스 제목 설정
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              생성할 데이트 코스의 이름을 입력해 주세요.
            </p>

            <form onSubmit={handleCreateCourseGroup}>
              <input
                type="text"
                placeholder="예: 성수동 감성 데이트"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 mb-5"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupMakerOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-sm font-semibold text-white hover:bg-rose-600 transition"
                >
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}