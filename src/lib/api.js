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

export function googleLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/google`;
}

export function kakaoLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/kakao`;
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
