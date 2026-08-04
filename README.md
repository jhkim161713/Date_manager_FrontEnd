# Date Manager

React + Vite + Tailwind CSS 프로젝트 (Figma Make 의존성 제거, 어디서든 실행 가능한 일반 프로젝트)

백엔드 저장소: [Date_Manager_Backend](https://github.com/jhkim161713/Date_Manager_Backend) — 로그인/회원가입이 되려면 이 백엔드가 `localhost:8080`에서 같이 떠있어야 합니다 (백엔드 저장소 README 참고).

## 실행 방법

```bash
npm install   # 또는 pnpm install / yarn install
npm run dev   # 개발 서버 실행 (http://localhost:4869)
npm run build # 프로덕션 빌드

`.env`에 `VITE_API_BASE_URL`로 백엔드 주소를 지정할 수 있습니다 (기본값 `http://localhost:8080`).

## 주요 파일

- `src/App.jsx` - 메인 애플리케이션 컴포넌트
- `src/main.jsx` - React 진입점
- `src/index.css` - 전역 스타일 및 Tailwind CSS import
- `src/lib/api.js` - 백엔드 API 호출 (로그인/회원가입/마이페이지)
- `package.json` - 의존성 및 스크립트
- `vite.config.js` - Vite 설정

## 스타일링

Tailwind v4 사용 중: src/index.css에 @import "tailwindcss"; 같은 v4 전용 문법이 잘 들어가 있다면 설정은 완벽합니다.

추가 설정 불필요: Vite 플러그인(@tailwindcss/vite)으로 연동되어 있기 때문에, 설명에 적힌 대로 별도의 postcss.config.js를 만들 필요 없이 유틸리티 클래스(className="...")를 JSX에 바로 갖다 쓰시면 끝납니다.
