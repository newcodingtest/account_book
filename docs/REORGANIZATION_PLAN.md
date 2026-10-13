# 문서 정리 적용 준비

현재 원본 파일은 아직 이동하지 않았습니다. 준비된 정리본은 .tools/reorganization/desired/ 아래에 있고, 현재 이 작업의 쓰기 허용 범위가 docs/에 한정되어 루트/배포 경로에 직접 적용할 수 없습니다. 프로젝트 루트 account를 작업 폴더로 열면 준비본을 적용할 수 있습니다.

## 최종 배치

```text
README.md                         프로젝트 소개·문서 목차
docs/
  AGENTS.md                       기존 실행 계약 그대로 보존
  DEVELOPMENT.md                  개발 환경·명령·테스트 실행
  ARCHITECTURE.md                  코드 책임·데이터 흐름
  IMPLEMENTATION_REPORT.md         진척·실행 증거·미검증 항목
deploy/
  MAC_MINI_DOCKER_DEPLOY.md         맥 미니 운영 절차
  CLOUDFLARE_PAGES.md              Pages 배포 절차
  Dockerfile
  Dockerfile.dockerignore
  compose.yaml
  compose.mac.yaml
  docker-mac.sh
  Caddyfile                        기존 파일 유지
  duckdns-update.sh                기존 파일 유지
  .env.example
  deployment-verification.json
```

일반 개발 문서와 운영 절차를 분리했습니다. 사용자 설치와 백업 설명은 앱의 /#guide에서 관리합니다. docs/에는 AI 프로젝트 이해·작업 계약·진척 문서만 둡니다. 실행 명령은 개발 안내, 결과는 검증 보고, 구성은 아키텍처가 담당합니다. README에서 상세 설명을 반복하지 않습니다. AGENTS.md의 명세는 실행 계약이므로 수정하지 않습니다.

## 경로 변경

Compose build context는 .., Dockerfile 경로는 deploy/Dockerfile입니다. 전용 ignore 파일은 Dockerfile.dockerignore로 옮겨 빌드 컨텍스트의 비밀 제외 규칙을 유지합니다. 실행 명령은 sh deploy/docker-mac.sh로 바뀌고 .env는 deploy/.env에서 읽습니다. Compose의 pocket-expense 프로젝트명과 인증서 볼륨 이름은 유지합니다. 루트에 실제 .env가 있으면 대상에 충돌이 없는 경우에만 옮깁니다. 토큰과 앱 기록은 읽거나 수정하지 않습니다.

## 적용 준비와 검증

[manifest.json](.tools/reorganization/manifest.json)은 원본과 준비본 해시 및 이동 경로를 기록합니다. [Apply.ps1](.tools/reorganization/Apply.ps1)은 기본적으로 변경 없이 계획을 출력하고 -Apply를 지정했을 때만 적용합니다. 원본 변경/대상 충돌 시 중단하고 원본은 .tools/ 아래에 백업합니다. 현재 PowerShell 실행 정책으로 실제 스크립트 실행은 차단되어 실행·롤백 동작은 미검증입니다.

준비된 Compose 변환, 맥 도우미 쉘 구문, PowerShell AST 구문, Docker COPY 원본 경로 및 로컬 문서 링크 45개를 검증했습니다. [검증 기록](.tools/reorganization/validation.json)을 참고하세요. Docker 엔진이 없어 실제 컨테이너 빌드/실행은 미검증입니다. 앱 코드는 변경하지 않았습니다.
