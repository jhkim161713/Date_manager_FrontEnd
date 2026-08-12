import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AdminPage } from './pages/AdminPage'
import './css/index.css'

// react-router 없이 경로만 직접 분기: /admin은 관리자 페이지, 그 외엔 기존 앱
// 회원가입은 별도 페이지가 아니라 LoginModal 안에서 화면 전환으로 처리한다.
const isAdminPage = window.location.pathname.startsWith('/admin')

function Root() {
  if (isAdminPage) return <AdminPage />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)