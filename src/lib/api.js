const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'dm_token';

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
