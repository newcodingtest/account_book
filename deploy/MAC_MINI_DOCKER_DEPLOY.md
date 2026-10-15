# Mac mini 배포

현재 배포 절차는 [공용 Caddy 배포 안내](SHARED_CADDY.md)를 확인하세요.

프로젝트 루트에서 `docker compose`를 직접 실행합니다. `.env`는 자동으로 읽습니다. 이전 Mac용 실행 스크립트와 override 파일은 제거되었습니다.

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

공용 네트워크와 Caddy는 위 안내에 따라 별도로 준비합니다. 기존 verification 파일은 이전 구성의 검증 기록입니다.

