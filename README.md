# Date Manager Backend

Spring Boot + Oracle 기반 백엔드. 구글/카카오 소셜 로그인, 이메일 회원가입, 마이페이지 API를 제공합니다.

프론트엔드 저장소: [Date_manager_FrontEnd](https://github.com/jhkim161713/Date_manager_FrontEnd)

## 처음 실행하기 전에 준비할 것

이 프로젝트는 **각자 로컬 PC에 Oracle DB가 설치되어 있어야** 실행됩니다 (공용 서버 없음). 아래 순서대로 준비해주세요.

### 1. Oracle DB 테이블 생성

로컬에 Oracle XE가 설치되어 있고, `date_manager`라는 이름의 계정(스키마)이 있어야 합니다. 없다면 SYSTEM 계정으로 먼저 만들어주세요.

```sql
CREATE USER date_manager IDENTIFIED BY "원하는비밀번호";
GRANT CONNECT, RESOURCE TO date_manager;
ALTER USER date_manager QUOTA UNLIMITED ON USERS;
```

그 다음 `date_manager` 계정으로 접속해서 이 저장소의 [`oracle-setup.sql`](./oracle-setup.sql) 파일 전체를 실행하세요. `users`, `social_accounts` 등 필요한 테이블이 생성됩니다.

### 2. `application-local.yml` 만들기

구글/카카오 Secret, DB 비밀번호 같은 실제 값은 보안상 git에 올리지 않습니다. 대신:

1. `src/main/resources/application-local.yml.example` 파일을 복사해서
2. 같은 폴더에 `application-local.yml`로 저장하고
3. 안의 값들을 채워 넣으세요 (실제 값은 팀 채팅방/노션 등 **git이 아닌 다른 채널**로 전달받으세요)

이 파일은 `.gitignore`에 등록되어 있어 커밋되지 않습니다.

### 3. 실행

**IntelliJ에서:**
- `server` 폴더(또는 이 저장소 루트)를 IntelliJ로 열기 → Maven 자동 임포트 대기
- `src/main/java/com/datemanager/ServerApplication.java` 열어서 실행 (▶ 버튼)

**터미널에서:**
```bash
./mvnw.cmd spring-boot:run
```

정상 기동되면 `http://localhost:8080/api/health` 에서 `{"ok":true, "userCount": ...}` 가 보여야 합니다.

## Redirect URI 등록 (최초 1회, 팀원 각자)

구글/카카오 로그인이 되려면, 각자 사용할 Google Cloud Console / Kakao Developers 앱에 아래 콜백 주소가 등록되어 있어야 합니다 (이미 팀 공용 앱으로 등록되어 있다면 생략 가능).

- Google: `http://localhost:8080/login/oauth2/code/google`
- Kakao: `http://localhost:8080/login/oauth2/code/kakao`

## 기술 스택

- Java 21, Spring Boot 4.1 (Web, Security, OAuth2 Client, Data JPA)
- Oracle Database (JDBC: `ojdbc11`)
- JWT (`jjwt`) 기반 자체 세션 발급
