# Date Manager

React + Vite + Tailwind CSS 프로젝트 (Figma Make 의존성 제거, 어디서든 실행 가능한 일반 프로젝트)

## 실행 방법

```bash
npm install   # 또는 pnpm install / yarn install
npm run dev   # 개발 서버 실행 (http://localhost:5173)
npm run build # 프로덕션 빌드
```

## 주요 파일

- `src/App.tsx` - 메인 애플리케이션 컴포넌트
- `src/main.tsx` - React 진입점
- `src/index.css` - 전역 스타일 및 Tailwind CSS import
- `package.json` - 의존성 및 스크립트
- `vite.config.ts` - Vite 설정

## 스타일링

Tailwind CSS v4를 사용합니다. JSX에서 Tailwind 유틸리티 클래스를 바로 사용하면 됩니다. Vite 플러그인으로 로드되므로 별도의 PostCSS 설정이 필요 없습니다.
