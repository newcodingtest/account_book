# 나의 지출 · Pocket Expense

React + TypeScript 기반의 한국어 지출 관리 PWA입니다. 여러 사용자가 같은 사이트에 접속할 수 있으며, 각자의 지출 기록은 각 기기의 IndexedDB에 저장됩니다. 로그인·서버 DB·기기 간 자동 동기화는 없습니다. 설치·사용·백업 안내는 앱의 `/#guide`에서 확인하세요.

## Mac mini 배포

현재 배포는 **서버 공용 Caddy + account Nginx 정적 서버**로 분리되어 있습니다. 먼저 [공용 프록시 배포 안내](deploy/SHARED_CADDY.md)를 따라 진행하세요. account 이미지에는 Caddy가 포함되지 않습니다. 현재 프로젝트는 80/443을 직접 점유하지 않으며, 프로젝트 중지·제거는 공용 Caddy에 영향을 주지 않습니다.

Docker Desktop을 실행하고 프로젝트 전체를 Mac에 복사합니다. 아래 명령은 `compose.yaml`과 `package.json`이 있는 프로젝트 루트에서 실행합니다. Mac에 Node/npm을 별도로 설치할 필요는 없습니다.

1. DuckDNS에 하위 주소를 등록하고 `.env`를 준비합니다.

   ```bash
   cp -n .env.example .env
   nano .env
   chmod 600 .env
   ```

   ```dotenv
   DOMAIN=account-book.duckdns.org
   DUCKDNS_SUBDOMAIN=account-book
   DUCKDNS_TOKEN=본인의_DuckDNS_토큰
   ```

   주소는 본인의 DuckDNS 주소로 변경합니다. 별도의 토큰 파일은 필요 없습니다. `.env`는 Git과 Docker 빌드에서 제외되며, 토큰이 포함될 수 있는 전체 Compose 설정 출력은 공유하지 마세요.

2. 공유기에서 Mac mini의 내부 IP를 DHCP 예약하고 TCP 외부 80 → 내부 80, 외부 443 → 내부 443을 전달합니다. DMZ 대신 필요한 포트만 설정하고 Mac 방화벽에서도 해당 연결을 허용합니다. 이중 공유기·CG-NAT·통신사 포트 차단이 있으면 추가 확인이 필요합니다.

3. 설정 검사, DNS 갱신, 빌드 및 실행을 순서대로 수행합니다.

   ```bash
   docker compose config --quiet
   docker compose run --rm duckdns --once
   docker compose up -d --build
   docker compose ps
   ```

   DNS 갱신은 `DuckDNS update: OK`로 확인합니다. 첫 빌드에서 의존성 설치와 lint/typecheck/test/build를 수행합니다. 프로젝트 루트의 `compose.yaml`과 `.env`를 자동으로 읽으므로 별도 스크립트나 Mac용 override 파일이 필요 없습니다.

4. 휴대폰 Wi-Fi를 끄고 LTE/5G에서 `https://account-book.duckdns.org`를 엽니다. 인증서 경고 없이 접속되면 홈 화면에 추가합니다. 별도로 실행한 공용 Caddy가 인증서를 자동 발급·갱신하며, DuckDNS는 5분마다 IP를 갱신합니다.

## 실행과 운영

| 작업 | 프로젝트 루트에서 실행할 명령 |
|---|---|
| 상태 확인 | `docker compose ps` |
| 최근 웹 로그 | `docker compose logs --tail=100 web` |
| 최근 DNS 로그 | `docker compose logs --since=2m duckdns` |
| 전체 로그 실시간 확인 | `docker compose logs -f --tail=50` |
| 전체 일시 중지 | `docker compose stop` |
| 중지한 컨테이너 시작 | `docker compose start` |
| 전체 재시작 | `docker compose restart` |
| 웹 서버만 재시작 | `docker compose restart web` |
| 코드 업데이트 후 재빌드 | `docker compose up -d --build web` |
| Compose 또는 `.env` 변경 적용 | `docker compose up -d --build --force-recreate` |
| DuckDNS 토큰 변경 적용 | `docker compose up -d --force-recreate duckdns` |
| 컨테이너 제거 후 종료 | `docker compose down` |
| 제거한 컨테이너 다시 생성 | `docker compose up -d --build` |

로그 실시간 확인은 Ctrl+C로 종료합니다. `restart`는 변경된 Compose 설정이나 환경 변수를 적용하지 않으므로, 설정 변경 후에는 `up`으로 재생성합니다.

인증서는 별도 공용 Caddy의 `mac-mini-caddy-data` 볼륨에 저장됩니다. 공용 Caddy 폴더에서는 인증서 볼륨을 삭제하는 `down -v`를 사용하지 않습니다. Docker Desktop 자동 시작과 Mac 잠자기 설정을 확인하고, macOS·Docker·컨테이너 이미지를 정기적으로 업데이트하세요. Mac 재부팅 후에는 Docker 엔진이 실행되어야 컨테이너가 복구됩니다.

사용자 기록은 서버에 저장되지 않으므로 Mac 백업으로 복구할 수 없습니다. 앱에서 JSON 백업을 내보내 보관하세요. 도메인을 변경하면 기존 기록은 자동 이동하지 않으므로 이전 주소에서 백업 후 새 주소에서 복원합니다.

## 로컬 개발

Node.js 24 LTS와 npm을 사용합니다.

```bash
npm ci
npm run dev
```

검증은 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`로 수행합니다.

## 문서

- [Mac mini 공용 Caddy 배포 안내](deploy/SHARED_CADDY.md)
- [프로젝트 명세와 작업 규칙](docs/AGENTS.md)
