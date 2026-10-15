# 맥 미니 Docker + Caddy + DuckDNS 배포

> 이 문서는 이전 단독 Caddy 구성의 기록입니다. 현재 설정으로 배포할 때는 [공용 Caddy 배포 안내](SHARED_CADDY.md)를 사용하세요. 아래 인증서 볼륨과 포트 설정, 검증 결과는 분리 이전 구성에 해당합니다.

사용자가 선택한 맥 미니 자체 정적 호스팅 구성입니다. DuckDNS는 무료 DDNS 주소를 제공하고 맥 미니가 앱 파일을 제공합니다. 앱의 지출은 계속 휴대폰 IndexedDB에만 저장되며 지출 API/서버 DB는 없습니다. 실제 공개 배포는 이 문서의 명령을 맥에서 실행할 때 이루어집니다.

## 구성

휴대폰 → https://내주소.duckdns.org → 집 공유기 → 맥 미니 Docker → Caddy → 앱 정적 파일

프로젝트 루트에 Dockerfile, compose.yaml, .env.example, deploy/Caddyfile, deploy/duckdns-update.sh를 준비했습니다. 작업 중 프로젝트가 account/docs에서 account로 이동했으므로 package.json·compose.yaml이 있는 account 폴더 전체를 맥으로 가져오세요. 맥의 예시 위치는 ~/pocket-expense입니다. deploy 폴더의 이 문서와 compose.mac.yaml·docker-mac.sh도 함께 가져와야 합니다.

Dockerfile은 Node 24로 npm ci와 lint/typecheck/test/build를 실행한 뒤 dist만 Caddy 이미지에 넣습니다. 맥에 Node/npm을 별도로 설치하거나 npm run dev를 실행할 필요는 없습니다. 실행 중에는 Caddy와 DuckDNS 갱신기 두 컨테이너만 사용합니다.

공개 레지스트리에서 실재 태그와 arm64/amd64 지원을 확인한 Node 24.21.0-alpine, Caddy 2.11.7-alpine, curlimages/curl 8.22.0을 digest까지 고정했습니다. Intel/Apple Silicon을 강제하지 않고 해당 맥 아키텍처로 선택합니다.

## 1. Docker 설치와 코드 준비

[Docker Desktop Mac 공식 안내](https://docs.docker.com/desktop/setup/install/mac-install/)에서 칩 종류에 맞는 버전을 설치하고 실행하세요. 개인 사용은 무료 이용 대상입니다. 현재 macOS 지원 조건도 확인하세요.

프로젝트 전체를 Git으로 가져오거나 복사합니다. 숨김 파일을 포함하되 Windows의 node_modules·dist·.tools·개인 백업·실제 토큰은 가져올 필요가 없습니다. 맥에서:

```bash
cd ~/pocket-expense
ls Dockerfile compose.yaml package.json package-lock.json .env.example deploy/docker-mac.sh
docker version
docker compose version
```

docker version에 Client와 Server가 모두 나와야 합니다. Server 연결 오류면 Docker Desktop을 먼저 실행하세요. 다른 서비스가 80/443을 쓰고 있다면 충돌하므로 기존 웹 서버 구성을 조사한 뒤 조정해야 합니다.

## 2. DuckDNS 주소와 토큰

[DuckDNS](https://www.duckdns.org/)에 로그인하고 하위 주소를 등록합니다. 예를 들어 pocket-expense-example을 만들면 pocket-expense-example.duckdns.org가 됩니다. 계정 화면의 token은 비밀 값이며 Git·채팅·스크린샷에 올리지 않습니다.

```bash
cp -n .env.example .env
nano .env
```

.env가 이미 있으면 덮어쓰지 않고 기존 파일을 편집합니다. 도메인·하위 주소·토큰을 이 파일 하나에서 관리합니다.

```dotenv
DOMAIN=pocket-expense-example.duckdns.org
DUCKDNS_SUBDOMAIN=pocket-expense-example
DUCKDNS_TOKEN=본인의_DuckDNS_토큰
```

DOMAIN은 전체 주소이며 DUCKDNS_SUBDOMAIN은 .duckdns.org를 제외한 앞부분입니다. 두 값은 같은 DuckDNS 주소를 가리켜야 합니다. 토큰에는 계정 화면의 실제 값을 넣습니다. nano 저장은 Ctrl+O → Enter, 종료는 Ctrl+X입니다.

```bash
chmod 600 .env
```

별도의 deploy/duckdns-token.txt는 필요하지 않습니다. .env는 Git과 Docker 빌드에서 제외됩니다. Compose는 토큰을 DuckDNS 컨테이너 환경 변수로 전달하므로 컨테이너 설정 조회에서 볼 수 있습니다. `config --quiet`를 사용하고 전체 `docker compose config` 출력은 공유하지 마세요. 웹 컨테이너에는 DOMAIN만 전달됩니다.

아래 명령은 프로젝트 루트의 .env와 기본 Compose, deploy/compose.mac.yaml을 함께 적용합니다.

## 3. 공유기와 외부 연결

공유기에서 맥 미니의 내부 IP를 DHCP 예약합니다. 예시 192.168.0.50 대신 실제 맥 주소를 사용하세요.

| 공유기 외부 | 맥 내부 | 프로토콜 | 용도 |
|---|---|---|---|
| 80 | 80 | TCP | HTTP→HTTPS, 인증서 발급 |
| 443 | 443 | TCP | HTTPS 접속 |
| 443 | 443 | UDP | HTTP/3, 선택 |

포트 포워딩과 macOS 방화벽의 필요한 연결을 설정합니다. 개발 포트 5173/4173, Caddy 관리 포트 2019, Docker API는 공개하지 않습니다.

집 인터넷이 외부에서 접근 가능한 공인 IP여야 합니다. 공유기 WAN이 사설 주소 또는 100.64.0.0/10 대역이면 CG-NAT/이중 NAT를 확인하세요. 통신사 포트 차단이나 CG-NAT이면 이 기본 방식이 동작하지 않을 수 있습니다. DuckDNS는 이런 제한을 우회하는 터널이 아닙니다. 사용하지 않는 잘못된 IPv6 AAAA 레코드가 있는지도 확인하세요.

DNS가 공인 IP를 가리키고 외부 80/443 연결이 열리면 Caddy가 HTTPS 인증서를 발급·갱신합니다. [Caddy 공식 조건](https://caddyserver.com/docs/automatic-https)

## 4. DNS 갱신과 앱 실행

```bash
sh deploy/docker-mac.sh config --quiet
sh deploy/docker-mac.sh run --rm duckdns --once
```

두 번째 명령은 실제 DuckDNS 주소를 갱신합니다. DuckDNS update: OK가 나와야 합니다. rejected면 주소/토큰을, network request failed면 연결을 확인합니다. 시작 후 5분마다 IPv4 갱신을 반복하며 토큰을 로그나 curl 프로세스 인자에 출력하지 않습니다. [DuckDNS API 규격](https://www.duckdns.org/spec.jsp)

```bash
dig +short pocket-expense-example.duckdns.org A
```

DNS는 맥의 사설 주소가 아닌 집의 공인 IPv4를 가리켜야 합니다. VPN을 쓰는 맥은 갱신기가 어느 외부 IP로 나가는지 확인하세요.

```bash
sh deploy/docker-mac.sh up -d --build
sh deploy/docker-mac.sh ps
sh deploy/docker-mac.sh logs --tail=50 duckdns
sh deploy/docker-mac.sh logs --tail=100 web
```

첫 빌드는 이미지 다운로드·의존성 설치·검증 때문에 시간이 걸립니다. DNS 전파가 늦으면 Caddy 인증서 발급도 지연될 수 있습니다. 현재 파일은 실행을 준비한 것이며 외부 HTTPS 성공은 해당 맥/공유기에서 확인해야 합니다.

## 5. 휴대폰에서 접속·설치

휴대폰의 Wi-Fi를 끄고 LTE/5G로 실제 주소를 엽니다.

```text
https://pocket-expense-example.duckdns.org
https://pocket-expense-example.duckdns.org/#guide
```

인증서 경고 없이 앱이 열리는지 확인하세요. Android Chrome 메뉴에서 설치, iPhone Safari 공유 → 홈 화면에 추가로 설치하고 생성된 아이콘으로 실행합니다. 상세 사용자 설명은 /#guide에 있습니다.

온라인에서 앱 자산 저장 → 기록 저장/수정/삭제 → 종료/재실행 → 비행기 모드에서 조회/CRUD → JSON 백업 다운로드/복원을 실제 기기에서 확인하세요.

이전 localhost·HTTP·다른 도메인의 기록은 새 HTTPS 주소로 자동 이동하지 않습니다. 기존 환경에서 JSON 백업을 만들어 새 주소/홈 화면 앱에서 수동 복원하세요. 대상에 기존 기록이 있으면 먼저 백업하세요. iPhone의 Safari 탭과 홈 화면 앱은 저장소가 별개일 수 있습니다. 앞으로 동일한 HTTPS 주소와 같은 아이콘을 사용하세요.

집 Wi-Fi에서만 외부 주소가 안 열리면 공유기의 NAT loopback 지원 또는 내부 DNS 설정을 확인하세요.

## 6. 코드 업데이트와 운영

새 코드 반영 후:

```bash
sh deploy/docker-mac.sh up -d --build web
```

앱에서 새 버전이 발견되면 사용자가 업데이트 버튼을 눌러 적용합니다. 동일한 주소를 유지하면 동일한 저장 영역을 사용합니다. Compose 설정을 바꿨다면 전체 up -d --build로 다시 적용하세요.

.env의 토큰을 교체한 뒤 갱신기를 재생성합니다.

```bash
sh deploy/docker-mac.sh up -d --force-recreate duckdns
```

일시 중지/다시 시작:

```bash
sh deploy/docker-mac.sh stop
sh deploy/docker-mac.sh start
```

caddy_data 볼륨은 인증서/개인키 보관용입니다. 일반 운영에서 down -v나 Docker 볼륨 초기화를 사용하면 인증서 데이터가 지워집니다. 인증서 볼륨은 사용자 지출 DB가 아니므로 Docker/맥 백업은 휴대폰 JSON 백업을 대체하지 않습니다.

로그인 시 Docker Desktop 시작과 맥 잠자기 설정을 확인하세요. restart: unless-stopped는 Docker 엔진이 실행돼야 동작합니다. 재부팅 후 엔진과 컨테이너 복구를 확인해야 하며 로그인 전 무인 부팅을 보장하는 구성은 아닙니다.

별도 유료 도메인/DB/API는 추가하지 않습니다. 자체 호스팅은 맥의 전력과 기존 인터넷 비용이 필요합니다. 이미지 보안 업데이트는 태그/digest를 검토·변경하고 재검증 후 적용하세요.

## 문제 확인

| 문제 | 확인 |
|---|---|
| Docker Server 연결 오류 | Docker Desktop 실행 |
| port already allocated | 기존 서비스의 80/443 사용 |
| DuckDNS rejected | 하위 주소·토큰 한 줄·.env |
| DUCKDNS_TOKEN 누락 | .env의 토큰 입력·컨테이너 재생성 |
| 외부 접속 실패 | 공인 IP·DNS·포트 전달·방화벽·CG-NAT/이중 NAT |
| 인증서 발급 실패 | DNS A/AAAA·외부 80/443·web 로그 |
| 기존 기록이 안 보임 | 기기/브라우저/홈 화면 실행/주소 차이·수동 백업 복원 |

## 검증 결과와 한계

Compose config(기본/맥 override), Caddy 2.11.7 validate, DuckDNS 스크립트/맥 도우미 쉘 구문 검증이 통과했습니다. DuckDNS는 가짜 OK/KO/네트워크 실패 응답으로 처리만 검증했으며 실제 주소·토큰 갱신은 하지 않았습니다.

로컬 Caddy로 실제 정적 응답을 확인했습니다: HTML/SW/Manifest 200, CSP, Manifest MIME, SW no-cache, 해시 자산 immutable, 메타데이터/없는 파일 404. 앱 lint/typecheck/test/build와 단위·DB 테스트 29개도 통과했습니다. 증거는 프로젝트 verification/와 deploy/deployment-verification.json에 있습니다.

현재 작업 환경에 실행 중인 Docker 엔진이 없어 이미지 빌드·컨테이너 실행·.env 토큰 전달·공인 HTTPS 발급·실기기 설치는 미검증입니다. 공개 배포를 완료했다고 주장하지 않습니다.
