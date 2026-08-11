import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SignupPage } from './pages/SignupPage'
import { AdminPage } from './pages/AdminPage'
import './css/index.css'

// react-router 없이 경로만 직접 분기: /signup은 회원가입, /admin은 관리자 페이지, 그 외엔 기존 앱
const path = window.location.pathname
const isSignupPage = path.startsWith('/signup')
const isAdminPage = path.startsWith('/admin')

function Root() {
  if (isSignupPage) return <SignupPage />
  if (isAdminPage) return <AdminPage />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)