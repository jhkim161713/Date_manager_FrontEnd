import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AdminPage } from './pages/AdminPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import './css/index.css'

// react-router 없이 경로만 직접 분기: /admin은 관리자 페이지, /reset-password는 비밀번호
// 재설정 메일 링크로 들어오는 독립 페이지, 그 외엔 기존 앱.
// 회원가입은 별도 페이지가 아니라 LoginModal 안에서 화면 전환으로 처리한다.
const isAdminPage = window.location.pathname.startsWith('/admin')
const isResetPasswordPage = window.location.pathname.startsWith('/reset-password')

function Root() {
  if (isAdminPage) return <AdminPage />
  if (isResetPasswordPage) return <ResetPasswordPage />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)