import Calendar from "react-calendar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'dm_token';

// 백엔드가 "/calendar"에서 "/api/calendar"로 바뀌었다(2026-08-22) - 원래 경로는 SecurityConfig의
// 인증 필수 규칙("/api/**")을 안 타서 로그인 없이도 뚫리다가 500이 나는 버그가 있었음.
export function getCalendars(start,end){
  return request(`/api/calendar?start=${start}&end=${end}`);
}

export function createCalendar(calendarData){
  return request(`/api/calendar`,{
    method : 'POST',
    body :JSON.stringify(calendarData)
  })
}

export function updateCalendar(id, calendarData) {
  return request(`/api/calendar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(calendarData),
  });
}

export function deleteCalendar(id){
  return request(`/api/calendar/${id}`, {
    method: 'DELETE',
  });
}



export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `요청 실패 (${res.status})`);
  }
  return data;
}

// 프로필 사진 업로드는 파일(FormData)이라 request()의 'Content-Type: application/json'과
// 충돌한다 - multipart/form-data는 브라우저가 boundary까지 포함해서 직접 설정해야 하므로
// Content-Type 헤더를 아예 안 넣고(fetch가 FormData를 보면 알아서 채워줌) 별도 함수로 뺐다.
export async function uploadProfilePhoto(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/me/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `요청 실패 (${res.status})`);
  }
  return data;
}

export function googleLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/google`;
}

export function kakaoLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/kakao`;
}

export function naverLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/naver`;
}

export function checkEmailAvailable(email) {
  return request(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
}

export function checkNicknameAvailable(nickname) {
  return request(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
}

export async function signup({ email, nickname, gender, password }) {
  const data = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, nickname, gender, password }),
  });
  setToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

// 비밀번호 재설정 메일 요청. 가입 안 된 이메일이어도 응답은 항상 성공으로 온다(계정 존재 여부 비노출).
export function findPassword(email) {
  return request('/api/auth/find-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// 메일 속 링크의 토큰 + 새 비밀번호로 실제 재설정을 완료한다.
export function resetPassword({ token, newPassword }) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export function getMe() {
  return request('/api/me');
}

export function updateMe({ nickname, gender }) {
  return request('/api/me', {
    method: 'PUT',
    body: JSON.stringify({ nickname, gender }),
  });
}

// 온보딩 화면의 energetic 축 이름만 백엔드/UserStyle의 energy 명칭으로 변환한다.
// 나머지 다섯 축은 프론트와 백엔드가 같은 이름을 사용한다.
export function saveOnboardingStyle(profile) {
  return request('/api/me/styles/onboarding', {
    method: 'PUT',
    body: JSON.stringify({
      energy: profile.scores.energetic,
      immersion: profile.scores.immersion,
      vibe: profile.scores.vibe,
      aesthetic: profile.scores.aesthetic,
      pacing: profile.scores.pacing,
      depth: profile.scores.depth,
    }),
  });
}

// 로그인 시 저장된 성향값을 불러와 personaProfile을 채우는 용도(2026-08-20) - 온보딩을 저장한 적
// 없는 유저는 백엔드가 204(빈 응답)로 응답하고, request()는 빈 body를 json()으로 파싱하다 실패하면
// null로 처리하므로(위 request() 참고) 그대로 null이 반환된다. saveOnboardingStyle과 반대 방향으로
// energy -> energetic만 다시 이름을 바꿔서 personaProfile.scores 모양에 맞춘다.
export async function getMyStyle() {
  const data = await request('/api/me/styles');
  if (!data) return null;
  return {
    scores: {
      energetic: data.energy,
      immersion: data.immersion,
      vibe: data.vibe,
      aesthetic: data.aesthetic,
      pacing: data.pacing,
      depth: data.depth,
    },
  };
}

// 날씨는 백엔드가 기상청 API를 대신 호출해서 가공한 결과만 내려줌 (인증키는 프론트에 노출 안 됨)
export function getWeather(lat, lon) {
  return request(`/api/weather?lat=${lat}&lon=${lon}`);
}

export function changePassword({ currentPassword, newPassword }) {
  return request('/api/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// 회원 자진 탈퇴 (soft-delete). 서버는 상태만 바꾸고 세션을 무효화하지 않으므로,
// 성공 후 프론트에서 직접 토큰을 지워야 실제로 로그아웃된다.
export function withdrawMe() {
  return request('/api/me', { method: 'DELETE' });
}

// 아래 admin* 함수들은 전부 관리자 전용 API (백엔드가 app.admin-email과 로그인 이메일을
// 비교해서 403을 돌려줄 수 있음). 페이지네이션이 있는 곳은 page=1이 첫 페이지 - 백엔드가
// spring.data.web.pageable.one-indexed-parameters=true라서 그렇다(0으로 보내면 안 됨).
// 신고 접수 - 게시판 글/댓글/유저 등 targetType은 백엔드 ReportController.VALID_TARGET_TYPES
// (USER/POST/COMMENT)와 반드시 일치해야 한다.
export function createReport({ targetType, targetId, reason }) {
  return request('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ targetType, targetId, reason }),
  });
}

export function adminCheck() {
  return request('/api/admin/check');
}

export function adminDashboard() {
  return request('/api/admin/dashboard');
}

export function adminListUsers({ page = 1, search = '', field = 'email', filter = 'all' } = {}) {
  const params = new URLSearchParams({ page, size: 15, field, filter });
  if (search.trim()) params.set('search', search.trim());
  return request(`/api/admin/users?${params.toString()}`);
}

// status: 'active'(기본, 해제된 예전 커플 제외) | 'all'(해제된 커플까지 포함)
export function adminListCouples({ filter = 'all', status = 'active' } = {}) {
  return request(`/api/admin/couples?filter=${filter}&status=${status}`);
}

export function adminUpdateUser(id, { nickname, gender }) {
  return request(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nickname, gender }),
  });
}

export function adminDeleteUser(id) {
  return request(`/api/admin/users/${id}`, { method: 'DELETE' });
}

export function adminUpdateCouple(id, { status }) {
  return request(`/api/admin/couples/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function adminDeleteCouple(id) {
  return request(`/api/admin/couples/${id}`, { method: 'DELETE' });
}

export function adminListSubscriptions({ page = 1, search = '', status = 'all' } = {}) {
  const params = new URLSearchParams({ page, size: 15, status });
  if (search.trim()) params.set('search', search.trim());
  return request(`/api/admin/subscriptions?${params.toString()}`);
}

export function adminCreateSubscription({ userEmail, planCode }) {
  return request('/api/admin/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ userEmail, planCode }),
  });
}

export function adminUpdateSubscription(id, { planCode, status, expiresAt, paymentProvider }) {
  return request(`/api/admin/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ planCode, status, expiresAt, paymentProvider }),
  });
}

export function adminDeleteSubscription(id) {
  return request(`/api/admin/subscriptions/${id}`, { method: 'DELETE' });
}

export function adminListNotices({ page = 1, size = 10 } = {}) {
  return request(`/api/admin/notices?page=${page}&size=${size}`);
}

export function adminCreateNotice({ title, content }) {
  return request('/api/admin/notices', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });
}

export function adminUpdateNotice(id, { title, content }) {
  return request(`/api/admin/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, content }),
  });
}

export function adminDeleteNotice(id) {
  return request(`/api/admin/notices/${id}`, { method: 'DELETE' });
}

// status: 'all' | 'PENDING' | 'RESOLVED' | 'REJECTED' - 'all'이면 백엔드에 status 파라미터 자체를
// 안 보낸다(AdminReportController가 status가 없으면 전체를 반환하는 방식이라).
export function adminListReports({ page = 1, status = 'all' } = {}) {
  const params = new URLSearchParams({ page, size: 15 });
  if (status !== 'all') params.set('status', status);
  return request(`/api/admin/reports?${params.toString()}`);
}

// status만 바꾸는 용도 - 신고 내용(사유/대상) 자체는 신고자가 접수한 그대로 두고 처리 상태만 갱신한다.
export function adminUpdateReportStatus(id, { status }) {
  return request(`/api/admin/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// 장소 목록 조회 - 실제 places/place_styles 테이블 데이터를 그대로 내려받는다(성향점수 검증용).
// 인증이 필요 없는 공개 API(PlaceController가 permitAll).
export function getPlaces({ category = '', page = 1, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size });
  if (category) params.set('category', category);
  return request(`/api/places?${params.toString()}`);
}

// 큐레이션 탭(데이트/숙박 카드)용 조회 API. matchScore는 아직 항상 null - 온보딩 성향값을 저장하는
// 파이프라인이 없어서(2026-08-14 기준 미구현) 프론트가 최신순으로 대체 정렬한다.
// district는 region 안에서 한 단계 더 좁히는 구/시(예: "중구") - "중구"/"고성군" 같은 이름은
// 여러 시/도가 똑같이 쓰기 때문에, region 없이 district만 보내면 백엔드가 무시하고 전국에서
// 찾아버린다(2026-08-19) - 반드시 region과 같이 보내야 한다.
// energyTarget(2026-08-20): 에너지 게이지(0~100) - 있으면 scoreEnergy가 가까운 순으로 정렬됨.
// lat/lon(2026-08-20): 있으면 그 위치 날씨를 확인해서 비 오면 실외 제외, 폭염/한파면 실내 우선 정렬.
export function getCurationPlaces({ category = '', subCategory = '', region = '', district = '', keyword = '', energyTarget = null, lat = null, lon = null, page = 1, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size });
  if (category) params.set('category', category);
  if (subCategory) params.set('subCategory', subCategory);
  if (region) params.set('region', region);
  if (district) params.set('district', district);
  if (keyword) params.set('keyword', keyword);
  if (energyTarget != null) params.set('energyTarget', energyTarget);
  if (lat != null && lon != null) {
    params.set('lat', lat);
    params.set('lon', lon);
  }
  return request(`/api/places/curation?${params.toString()}`);
}

// 큐레이션 탭 "내 주변만 보기" 토글용 - 좌표 기준 가까운 순 + 카테고리 필터를 동시에 적용한다.
// nearby 계열이라 이미 거리순으로 오기 때문에 별도 정렬 옵션이 필요 없다.
export function getNearbyCurationPlaces({ lat, lon, category = '', subCategory = '', region = '', district = '', keyword = '', limit = 30 }) {
  const params = new URLSearchParams({ lat, lon, limit });
  if (category) params.set('category', category);
  if (subCategory) params.set('subCategory', subCategory);
  if (region) params.set('region', region);
  if (district) params.set('district', district);
  if (keyword) params.set('keyword', keyword);
  return request(`/api/places/curation/nearby?${params.toString()}`);
}

// 큐레이션 탭 카테고리 칩에 "OO곳" 개수를 표시하기 위한 대분류별 집계. { "맛집": 1234, ... } 형태.
// region을 주면 그 지역 안에서만 집계한다(2026-08-19) - 안 주면 전국 집계.
export function getPlaceCategoryCounts(region = '', district = '') {
  const params = new URLSearchParams();
  if (region) params.set('region', region);
  if (district) params.set('district', district);
  const qs = params.toString();
  return request(`/api/places/category-counts${qs ? `?${qs}` : ''}`);
}

// 숙박 탭처럼 대분류 하나를 세부분류 칩으로 한 번 더 쪼갤 때 쓰는 집계. { "호텔": 6501, ... } 형태.
// 대분류 하나의 세부분류 목록(이름+이모지)을 DB 그대로 받아온다(2026-08-22) - 맛집 세부칩을
// 프론트에 하드코딩했다가 실제 DB(14개)와 어긋났던 걸 겪어서, 모든 대분류의 세부칩을 이 API로
// 항상 최신 상태로 그리도록 바꿨다. 반환 형태: [{subCategory, emoji}, ...]
export function getPlaceSubCategoryCatalog(parent) {
  return request(`/api/places/categories?parent=${encodeURIComponent(parent)}`);
}

export function getPlaceSubCategoryCounts(category, region = '', district = '') {
  const params = new URLSearchParams({ category });
  if (region) params.set('region', region);
  if (district) params.set('district', district);
  return request(`/api/places/category-counts/sub?${params.toString()}`);
}

// 접속 좌표에서 가까운 순으로 장소를 가져온다 - 홈탭 지역 기반 추천용. 백엔드가 하버사인 거리
// 계산까지 끝내서 정렬된 상태로 내려주므로 프론트에서 다시 거리 계산할 필요 없음.
export function getNearbyPlaces(lat, lon, limit = 300, category = '') {
  const params = new URLSearchParams({ lat, lon, limit });
  if (category) params.set('category', category);
  return request(`/api/places/nearby?${params.toString()}`);
}

// 좋아요 - place_likes 테이블에 실제로 저장/삭제된다(2026-08-22, 처음엔 신호만 보내고 저장은
// 안 했는데 새로고침하면 다 꺼져서 실제 찜 기능으로 못 썼다. 진짜 좋아요로 바꿈). 새로 좋아요를
// 누른 순간에만 백엔드가 UserStyle 실시간 갱신 엔진도 같이 트리거한다(뺄 땐 안 건드림).
// 장소 상세 - 홈/큐레이션 카드를 클릭하면 이 API로 상세 정보를 불러온다(2026-08-22). 백엔드가
// 로그인 유저의 이 호출 자체를 "장소 열람"(약한 신호)으로 UserStyle 실시간 갱신에도 반영한다.
export function getPlace(placeId) {
  return request(`/api/places/${placeId}`);
}

export function getLikedPlaceIds() {
  return request('/api/places/likes');
}

export function likePlace(placeId) {
  return request(`/api/places/${placeId}/like`, { method: 'POST' });
}

export function unlikePlace(placeId) {
  return request(`/api/places/${placeId}/like`, { method: 'DELETE' });
}

// 코스 담기 - 담기함 자체는 아직 CurationTab의 로컬 state로만 관리된다(진짜 코스 저장은
// CourseGroup/CourseItem 도메인 몫이라, 빌더 점검 때 정리 예정 - 지금 별도 테이블을 만들면
// 나중에 두 체계로 갈라질 위험이 있어서 보류). 이 API는 "담았다"는 신호만 넘긴다.
export function addPlaceToCourse(placeId) {
  return request(`/api/places/${placeId}/course-add`, { method: 'POST' });
}

// 커플 초대 링크 생성 (1시간 유효). 이미 연결된 커플이 있으면 백엔드가 409 에러를 던짐.
export function createCoupleInvite() {
  return request('/api/couple/invite', { method: 'POST' });
}

// 초대 링크의 토큰으로 수락 -> 성공하면 실제 Couple/CoupleMember가 생성됨
export function acceptCoupleInvite(token) {
  return request(`/api/couple/invite/${token}/accept`, { method: 'POST' });
}

// 내 커플 연결 상태 + 상대방 정보 조회
export function getCoupleStatus() {
  return request('/api/couple/status');
}

// 커플 연결 해제
export function disconnectCouple() {
  return request('/api/couple', { method: 'DELETE' });
}

// 실제로 처음 만난 날짜 등록/수정 (이 사이트에서 연결된 날짜인 connectedAt과는 별개 값).
// metDate를 null로 보내면 등록을 취소(초기화)한다.
export function updateMetDate(metDate) {
  return request('/api/couple/met-date', {
    method: 'PUT',
    body: JSON.stringify({ metDate }),
  });
}

// 관리자가 "다시 연결" 해줬다는 배너를 사용자가 확인했을 때 호출 - 이후 getCoupleStatus()의
// reconnectedByAdminAt이 다시 null로 돌아와 배너가 사라진다.
export function ackAdminReconnect() {
  return request('/api/couple/ack-admin-reconnect', { method: 'POST' });
}

// 로그인 직후/탭 재활성화 시 App.jsx가 호출 - 내가 없는 사이 파트너가 초대를 수락했거나
// 만난 날짜를 입력했으면 안 읽은 알림 목록으로 내려온다.
export function getUnreadCoupleNotifications() {
  return request('/api/couple/notifications/unread');
}

// 알림 배너의 "확인했어요"를 눌렀을 때 - 그 시점의 안 읽은 알림을 전부 읽음 처리한다.
export function ackCoupleNotifications() {
  return request('/api/couple/notifications/read-all', { method: 'POST' });
}

// 내 구독 상태 조회 (구독 없으면 { hasSubscription: false })
export function getMySubscription() {
  return request('/api/subscriptions/me');
}

// 토스 결제위젯으로 카드 등록 인증(requestBillingAuth)까지 마친 뒤 받은 authKey/customerKey로 빌링키 발급
export function issueBillingKey({ authKey, customerKey, planCode }) {
  return request('/api/subscriptions/billing-key', {
    method: 'POST',
    body: JSON.stringify({ authKey, customerKey, planCode }),
  });
}

// 결제 실패(PAST_DUE) 상태의 구독을 저장된 빌링키로 수동 재결제 시도 (카드 재인증 불필요)
export function retryChargeSubscription() {
  return request('/api/subscriptions/charge', { method: 'POST' });
}

// 구독 해지 - 이미 낸 이용 기간(expiresAt)까지는 유지되고, 이후 자동 갱신만 안 됨
export function cancelSubscription() {
  return request('/api/subscriptions/cancel', { method: 'POST' });
}

// 게시판(자유게시판) - BoardController CRUD 그대로 연결.
export function getBoardPosts() {
  return request('/api/board');
}

export function getBoardPost(id) {
  return request(`/api/board/${id}`);
}

export function createBoardPost({ title, content }) {
  return request('/api/board', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });
}

export function updateBoardPost(id, { title, content }) {
  return request(`/api/board/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, content }),
  });
}

export function deleteBoardPost(id) {
  return request(`/api/board/${id}`, { method: 'DELETE' });
}

// AI 챗봇 - 새 대화 세션 시작 (title은 선택, 안 넘기면 백엔드가 null로 저장)
// "지난 대화 보기" 목록 - 로그아웃 후 다른 브라우저로 들어와도(localStorage 세션 포인터가 없어도)
// DB에 저장된 이 유저의 세션을 최신순으로 보여준다. 대화가 쌓일 걸 감안해 15개씩 페이지네이션
// (AiChatController가 Spring의 Pageable을 그대로 바인딩해서 0페이지가 첫 페이지라, 여기서 하나 뺀다).
export function getAiChatSessions({ page = 1 } = {}) {
  return request(`/api/aichat/sessions?page=${page - 1}&size=15`);
}

export function createAiChatSession(title) {
  return request('/api/aichat/sessions', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

// 메시지 보내고 AI 응답 받기 - 세션의 지난 대화 전체를 백엔드가 기억해서 문맥 있는 답을 줌.
// lat/lon은 선택값 - 위치 권한이 없으면 안 보내도 되고, 그 경우 백엔드는 날씨 없이 현재 시각만 참고한다.
export function sendAiChatMessage(sessionId, text, { lat, lon } = {}) {
  return request(`/api/aichat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      text,
      lat: lat != null ? String(lat) : undefined,
      lon: lon != null ? String(lon) : undefined,
    }),
  });
}

// 세션의 메시지 이력 전체 조회 (오래된 순)
export function getAiChatMessages(sessionId) {
  return request(`/api/aichat/sessions/${sessionId}/messages`);
}

// "AI 코스 추천"(홈탭 배너, 2026-08-25 추가) - 채팅 세션과 무관한 1회성 추천 4곳을 받아온다.
export function getAiCourseRecommendation() {
  return request('/api/aichat/course-recommendation');
}

// 데이트 코스 빌더(2026-08-20) - 백엔드 feature/course-place-integration 브랜치 API를 최소한으로
// 연결해서, 큐레이션에서 담은 실제 place 데이터가 코스빌더까지 정상적으로 오는지 확인하는 용도.
export function createCourseGroup(title) {
  return request('/api/course/groups', { method: 'POST', body: JSON.stringify({ title }) });
}

export function getCourseGroups() {
  return request('/api/course/groups');
}

export function getCourseGroup(groupId) {
  return request(`/api/course/groups/${groupId}`);
}

export function addCourseItem(groupId, placeId) {
  return request(`/api/course/groups/${groupId}/items`, {
    method: 'POST',
    body: JSON.stringify({ placeId }),
  });
}

// Step 2 자동 매칭(성향 보완 스팟 추천) - 추천만 하고 코스에 바로 담지는 않음.
export function autoMatchCourse(groupId) {
  return request(`/api/course/groups/${groupId}/auto-match`);
}

// 코스 그룹 통째로 삭제(2026-08-20, 사용자 피드백 - "빌더로 코스를 계속 담았으면 삭제하는 기능이
// 있어야 할 것 같다").
export function deleteCourseGroup(groupId) {
  return request(`/api/course/groups/${groupId}`, { method: 'DELETE' });
}

// 담긴 장소 하나만 빼기(2026-08-20, "담겨진 코스에 중간에 한두군데를 뺄 수 있어야 한다").
export function removeCourseItem(groupId, itemId) {
  return request(`/api/course/groups/${groupId}/items/${itemId}`, { method: 'DELETE' });
}

// 담긴 장소 순서를 한 칸 앞/뒤로("up"/"down", 2026-08-20, "순서를 바꾸는 기능").
export function moveCourseItem(groupId, itemId, direction) {
  return request(`/api/course/groups/${groupId}/items/${itemId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ direction }),
  });
}
