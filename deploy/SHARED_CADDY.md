# Mac mini 공용 Caddy 배포

공용 Caddy가 여러 프로젝트의 HTTPS와 80/443 포트를 관리합니다. account 앱은 Nginx로 내부 HTTP 정적 파일을 제공하며 기존 보안 헤더와 PWA 캐시 정책을 유지합니다. account 이미지에는 Caddy가 포함되지 않습니다.

휴대폰 → 공유기 → 공용 Caddy(HTTPS) → account Nginx(pocket-expense-web:80) → 정적 앱

| 역할 | 배포 파일 | 실행 이미지 |
|---|---|---|
| account 앱 | 루트 `Dockerfile`, `compose.yaml`, `deploy/nginx.conf` | Nginx + 앱 빌드 결과 |
| 공용 HTTPS 프록시 | `deploy/shared-proxy/`를 독립 서버 폴더로 복사 | Caddy |

Dockerfile의 Node 단계는 빌드 시에만 사용합니다. 최종 앱 이미지에는 Nginx와 `dist`만 들어갑니다. 앱 빌드 컨텍스트에서는 공용 프록시 템플릿도 제외됩니다.

## 서버 공용 구성 설치

Docker Desktop을 실행하고 프로젝트 루트에서 최초 한 번 준비합니다. 네트워크가 이미 있으면 생성 명령을 생략합니다.

```bash
docker network create mac-mini-proxy
mkdir -p ~/server-infra
cp -R deploy/shared-proxy ~/server-infra/caddy
cd ~/server-infra/caddy
cp config/sites/pocket-expense.caddy.example config/sites/pocket-expense.caddy
nano config/sites/pocket-expense.caddy
```

사이트 파일에 실제 도메인을 입력합니다.

```caddyfile
account-book.duckdns.org {
    reverse_proxy pocket-expense-web:80
}
```

`~/server-infra/caddy`는 독립 운영 디렉터리입니다. 프로젝트의 템플릿을 이후 다시 복사해 운영 설정을 덮어쓰지 마세요. 공용 프록시가 이미 있다면 새 프록시를 띄우는 대신 그 프록시를 같은 네트워크에 연결하고 사이트 설정만 추가합니다.

## 프로젝트 실행

프로젝트 전체를 `~/pocket-expense`에 복사한 예시입니다.

```bash
cd ~/pocket-expense
cp -n .env.example .env
nano .env
chmod 600 .env
```

```dotenv
DOMAIN=account-book.duckdns.org
PROXY_NETWORK=mac-mini-proxy
APP_UPSTREAM=pocket-expense-web
DUCKDNS_SUBDOMAIN=account-book
DUCKDNS_TOKEN=본인의_DuckDNS_토큰
```

DOMAIN은 앱 빌드 주소이며 공용 사이트 파일의 도메인과 일치해야 합니다. APP_UPSTREAM은 사이트 파일에서 사용하는 고유 네트워크 별칭입니다. DuckDNS 주소를 등록하고 토큰을 입력합니다. `.env`와 토큰은 공유하지 않습니다.

```bash
docker compose config --quiet
docker compose run --rm duckdns --once
docker compose up -d --build
docker compose ps
```

DuckDNS는 `DuckDNS update: OK`를 확인합니다. 현재 갱신기는 이 프로젝트에서 실행하며 5분마다 갱신합니다. 서버 공용 DNS 갱신기로 이관할 경우 같은 주소의 갱신기를 중복 운영하지 않도록 조정하세요.

공유기에서 Mac의 내부 IP를 예약하고 TCP 80/443을 전달합니다. HTTP/3을 사용하면 UDP 443도 전달합니다. DNS가 집의 공인 IP를 가리키고 외부 연결이 가능해야 합니다.

```bash
cd ~/server-infra/caddy
docker compose config --quiet
docker compose run --rm --no-deps caddy caddy validate --config /etc/caddy/Caddyfile
docker compose up -d
docker compose logs --tail=100 caddy
```

휴대폰 LTE/5G에서 실제 HTTPS 주소와 `/#guide`를 열어 인증서와 앱 접속을 확인합니다.

## 다른 프로젝트 추가

각 프로젝트의 웹 서비스에 공용 네트워크와 고유 별칭을 추가합니다. DB는 프로젝트 전용 네트워크에 둡니다. 공용 네트워크에 연결된 컨테이너끼리는 접근이 가능합니다.

```yaml
services:
  web:
    # 해당 프로젝트의 image/build 설정
    networks:
      proxy:
        aliases:
          - another-project-web
networks:
  proxy:
    external: true
    name: mac-mini-proxy
```

공용 디렉터리에 `config/sites/another-project.caddy`를 추가합니다. 포트는 해당 앱의 내부 포트입니다.

```caddyfile
another-project.duckdns.org {
    reverse_proxy another-project-web:3000
}
```

```bash
cd ~/server-infra/caddy
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

같은 앱을 독립 인스턴스로 운영하면 Compose 프로젝트 이름(`-p`), DOMAIN, APP_UPSTREAM과 빌드 이미지 태그를 각각 다르게 지정합니다. 별칭이 중복되면 의도치 않은 인스턴스로 요청이 전달될 수 있습니다.

## 업데이트와 기존 배포 전환

앱 업데이트는 프로젝트 루트에서 `docker compose up -d --build web`으로 적용합니다. 프로젝트 `stop`·`down`은 공용 프록시를 중지하지 않습니다. 도메인 변경 시 공용 사이트 설정 변경과 앱 재빌드가 모두 필요합니다.

기존 내부 Caddy에서 Nginx로 전환할 때도 같은 명령으로 웹 컨테이너만 교체합니다. 별칭과 내부 포트 80을 유지하므로 공용 Caddy 설정은 그대로 사용합니다.

기존 앱이 80/443을 점유한다면 새 앱 구성으로 재생성한 뒤 공용 프록시를 시작합니다. 전환 중 잠시 접속이 중단됩니다. 기존 인증서 볼륨은 삭제하지 마세요. 새 공용 볼륨 `mac-mini-caddy-data`를 쓰면 인증서를 새로 발급합니다. 기존 인증서를 유지하려면 `docker volume ls`로 실제 이름을 확인하고 공용 Compose의 `caddy_data`를 그 이름의 `external: true` 볼륨으로 연결합니다. 공용 볼륨을 삭제하는 `down -v`는 일반 종료에 사용하지 않습니다.

사용자 지출은 휴대폰 IndexedDB에 저장되며 인증서 볼륨과 무관합니다. 동일한 도메인을 유지하세요. 도메인을 바꾸면 이전 주소에서 JSON 백업 후 새 주소에서 복원합니다.

## 검증 범위

앱/공용 프록시 Compose 구문 검증과 Nginx 1.30.6 설정 검증이 통과했습니다. 로컬 Nginx에서 HTML·SW·Manifest 200, Manifest MIME, 보안 헤더, 해시 자산 immutable 캐시, 나머지 파일 no-cache, 없는 파일 404를 확인했습니다. 로컬 검증은 Windows용 Nginx에서 경로와 수신 포트를 바꿔 수행했습니다. Docker 엔진이 실행되지 않아 Linux 이미지 빌드, 컨테이너 연결과 공인 HTTPS 발급은 실제 Mac에서 위 명령으로 확인해야 합니다.

Nginx 이미지의 버전과 digest는 공식 레지스트리에서 확인해 고정했습니다. 헤더 상속 동작은 [Nginx 공식 문서](https://nginx.org/en/docs/http/ngx_http_headers_module.html)를 기준으로 설정했습니다.
