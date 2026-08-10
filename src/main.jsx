import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SignupPage } from './pages/SignupPage'
import './index.css'

// react-router 없이 경로 하나만 직접 분기: /signup이면 회원가입 페이지, 그 외엔 기존 앱
const isSignupPage = window.location.pathname.startsWith('/signup')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSignupPage ? <SignupPage /> : <App />}
  </React.StrictMode>,
)