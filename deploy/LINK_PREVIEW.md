# 링크 공유 미리보기

HTML에 Open Graph 제목·설명과 기존 512px PNG 앱 아이콘을 지정합니다. Docker 빌드에서는 Compose가 `.env`의 `DOMAIN`으로 HTTPS 절대 주소를 설정합니다.

적용: 프로젝트 루트에서 `sh deploy/docker-mac.sh up -d --build web`을 실행합니다. 도메인을 변경할 때도 다시 빌드합니다.

Docker 외 정적 호스팅은 빌드 환경 변수 `VITE_SITE_URL`을 실제 사이트 주소(예: `https://example.pages.dev`)로 설정합니다. 미설정 시 로컬 개발 주소를 사용합니다.

배포 후 페이지 소스의 `og:image`가 실제 HTTPS 주소인지, 해당 PNG가 공개적으로 열리는지 확인합니다. 카카오톡에서 예전 미리보기가 유지되면 [카카오톡 URL 메타정보 관리](https://developers.kakao.com/docs/ko/tool/common) 안내에 따라 URL 조회 및 캐시 초기화 후 다시 공유합니다.
