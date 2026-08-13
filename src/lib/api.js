const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'dm_token';
const MOCK_USER_KEY = 'dm_mock_user';

// 백엔드(Oracle) 없이도 다른 탭 작업을 위해 로그인만 통과시키는 테스트 계정
// 실제 DB에 저장되지 않고, 브라우저 로컬에만 존재함
export const MOCK_USERS = [
  { email: 'admin', password: 'password', nickname: '관리자', gender: 'UNKNOWN' },
  { email: 'couple', password: 'couple', nickname: '커플', gender: 'UNKNOWN' },
  { email: 'test@test.com', password: 'test1234', nickname: '테스트유저', gender: 'UNKNOWN' },
];

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getMockUser() {
  const raw = localStorage.getItem(MOCK_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setMockUser(user) {
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
}

export function clearMockUser() {
  localStorage.removeItem(MOCK_USER_KEY);
}

// 백엔드 연결 없이, MOCK_USERS와 아이디/비밀번호가 일치하면 로컬에만 로그인 처리
export function tryMockLogin({ email, password }) {
  const found = MOCK_USERS.find(u => u.email === email && u.password === password);
  if (!found) return null;
  const user = { id: found.email, email: found.email, nickname: found.nickname, gender: found.gender };
  setMockUser(user);
  return user;
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

export function getMe() {
  return request('/api/me');
}

export function updateMe({ nickname, gender }) {
  return request('/api/me', {
    method: 'PUT',
    body: JSON.stringify({ nickname, gender }),
  });
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

export function adminListCouples({ filter = 'all' } = {}) {
  return request(`/api/admin/couples?filter=${filter}`);
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

// 장소 목록 조회 - 실제 places/place_styles 테이블 데이터를 그대로 내려받는다(성향점수 검증용).
// 인증이 필요 없는 공개 API(PlaceController가 permitAll).
export function getPlaces({ category = '', page = 1, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size });
  if (category) params.set('category', category);
  return request(`/api/places?${params.toString()}`);
}

// 접속 좌표에서 가까운 순으로 장소를 가져온다 - 홈탭 지역 기반 추천용. 백엔드가 하버사인 거리
// 계산까지 끝내서 정렬된 상태로 내려주므로 프론트에서 다시 거리 계산할 필요 없음.
export function getNearbyPlaces(lat, lon, limit = 300) {
  const params = new URLSearchParams({ lat, lon, limit });
  return request(`/api/places/nearby?${params.toString()}`);
}

// 커플 초대 링크 생성 (24시간 유효). 이미 연결된 커플이 있으면 백엔드가 409 에러를 던짐.
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

// AI 챗봇 - 새 대화 세션 시작 (title은 선택, 안 넘기면 백엔드가 null로 저장)
export function createAiChatSession(title) {
  return request('/api/aichat/sessions', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

// 메시지 보내고 AI 응답 받기 - 세션의 지난 대화 전체를 백엔드가 기억해서 문맥 있는 답을 줌
export function sendAiChatMessage(sessionId, text) {
  return request(`/api/aichat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

// 세션의 메시지 이력 전체 조회 (오래된 순)
export function getAiChatMessages(sessionId) {
  return request(`/api/aichat/sessions/${sessionId}/messages`);
}
