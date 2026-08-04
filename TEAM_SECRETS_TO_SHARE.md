# 팀원에게 공유할 값 (이 파일은 git에 올라가지 않습니다)

`application-local.yml` 실행에 필요한 값들. 카카오톡 개인 DM이나 팀 노션의 **비공개** 페이지로 전달하세요 (공개 채널/전체 공지방은 피할 것).

## 공유해야 하는 값 (팀 공용 구글/카카오 앱이라 전원 동일해야 함)

```
GOOGLE_CLIENT_ID: 681801134722-4itdnjpm6a6cvkrr7en3h7kuv31hl3d5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET: 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
KAKAO_CLIENT_ID: 3d4417b1729cbb24fb7381b25c126bd6
KAKAO_CLIENT_SECRET: CCRYJAxQZt8K3TRAo3ZgOiFBMkDpDCNr
```

## 각자 알아서 정해도 되는 값 (공유 불필요)

- **Oracle 비밀번호**: 각자 자기 로컬 Oracle에 `date_manager` 계정 만들 때 스스로 정하는 값
- **JWT 시크릿**: 각자 컴퓨터 안에서만 쓰이는 값, 아무 문자열이나 32자 이상으로

## 팀원에게 보낼 메시지 (복붙용)

```
[Date Manager 백엔드 로컬 설정용]
GOOGLE_CLIENT_ID: 681801134722-4itdnjpm6a6cvkrr7en3h7kuv31hl3d5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET: 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
KAKAO_CLIENT_ID: 3d4417b1729cbb24fb7381b25c126bd6
KAKAO_CLIENT_SECRET: CCRYJAxQZt8K3TRAo3ZgOiFBMkDpDCNr

* application-local.yml.example 복사해서 application-local.yml 만들고 위 값 채워넣으면 됨
* Oracle 비밀번호/JWT는 본인이 아무거나 정해서 넣으면 됨
```
