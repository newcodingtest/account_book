# 나의 지출 · Pocket Expense

개인 기기에서 수동 입력하는 한국어/KRW 지출 전용 PWA입니다. React + TypeScript + Vite, Dexie IndexedDB, Zod, vite-plugin-pwa를 사용합니다. 서버·로그인·클라우드 DB·유료 API·외부 폰트·텔레메트리는 없습니다.

## 실행

Node.js 24 LTS(24.15.0 이상, 25 미만)와 npm을 설치합니다. 검증 환경은 Node 24.21.0입니다. 의존성은 정확한 버전과 package-lock.json으로 고정했습니다. Vite의 Node 요구 조건은 [공식 가이드](https://vite.dev/guide/)에서 확인할 수 있습니다.

프로젝트 파일은 현재 `account/docs` 폴더에 있습니다. PowerShell에서 해당 폴더로 이동한 뒤 실행하세요.

```powershell
Set-Location "D:\backup\vsCodeworkspace\side\account\docs"
npm ci
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run preview
npx playwright install chromium
npm run test:e2e
```

프로덕션 미리보기 주소: http://127.0.0.1:4173. 테스트는 프로덕션 dist를 사용하므로 먼저 빌드하세요. Chrome 실행 파일을 직접 쓰려면 PLAYWRIGHT_CHROME_PATH 환경변수를 지정할 수 있습니다. 개발 서버의 화면만으로 오프라인 지원을 판단하지 않습니다.

## 저장과 백업

실제 지출은 pocket-expense-db IndexedDB에만 저장합니다. 마지막 백업 파일 생성 시각만 localStorage 설정으로 저장합니다. 빈 DB에 샘플 데이터를 자동 삽입하지 않습니다. 금액은 1~999,999,999원 정수이며 날짜는 현지 달력의 YYYY-MM-DD입니다.

설정 및 백업 → JSON 백업 내보내기에서 파일을 만듭니다. 백업 파일은 금융 관련 개인 기록을 담은 평문입니다. 다운로드 완료와 보관 위치를 직접 확인하세요. 생성 시각은 파일이 실제 보관됐다는 보증이 아닙니다. 지원 브라우저에서는 파일 공유도 제공합니다.

JSON 백업에서 복원 → 파일 검증 → 건수·기간·합계·현재 건수 미리보기 → 전체 교체 확인 순서로 진행합니다. 버전 1, 최대 10 MiB·50,000건만 허용합니다. ID 중복·잘못된 UUID·금액·날짜·카테고리·필드 누락은 거부합니다. 기존 기록 전체를 단일 IndexedDB 트랜잭션으로 교체하며 병합은 없습니다. 취소하면 변경하지 않습니다. 복원 전 기존 기록을 백업하세요.

브라우저 데이터 삭제·기기 교체·저장소 정리로 데이터가 사라질 수 있습니다. 지속 저장 요청은 데이터 보증이나 백업 대체가 아닙니다. 다른 기기/브라우저/설치본은 JSON을 수동 이동하고 복원해야 합니다. Safari 탭과 iPhone 홈 화면 PWA의 저장소는 별개일 수 있으며 자동 동기화를 보장하지 않습니다. 같은 홈 화면 아이콘으로 계속 사용하세요.

개인 백업을 Git에 추가하지 마세요. backups/ 및 pocket-expense-backup-*.json은 .gitignore에 포함했습니다. public/에 개인 파일을 넣으면 배포 산출물에 포함되므로 금지합니다.

## 모바일 설치

- Android Chrome: 배포된 HTTPS 주소 열기 → 브라우저 메뉴 → 앱 설치 또는 홈 화면에 추가.
- iPhone Safari: 배포된 HTTPS 주소 열기 → 공유 메뉴 → 홈 화면에 추가 → 생성된 아이콘으로 실행.

최초 접속과 새 버전 다운로드에는 인터넷이 필요합니다. 서비스 워커 설치 후 앱 정적 자산만 캐시하고 IndexedDB 지출이나 백업 파일은 캐시하지 않습니다. 업데이트는 사용자가 선택하며 편집 중에는 미저장 입력 폐기를 확인합니다. [PWA React 공식 안내](https://vite-pwa-org.netlify.app/frameworks/react.html)에 따른 prompt 등록 방식입니다.

## 아키텍처

- src/domain: Expense·고정 카테고리·입력/레코드 스키마.
- src/data: 버전 1 Dexie DB와 Repository. 생성 add, 수정 update, 월 범위 조회 및 정렬.
- src/features: 지출 편집, 홈, 달력/내역, 순수 집계, 통계, 백업/복원 UI/API.
- src/shared: 날짜/돈/다운로드 유틸, 월 선택, 모달.
- tests: 도메인·DB·관찰·집계·백업·롤백 테스트.
- e2e: 실제 브라우저 CRUD·영속성·달력·백업·오프라인/모바일 검증.
- verification: Phase별 실제 명령 결과.

Repository와 Dexie useLiveQuery 관찰을 통해 변경 후 화면을 갱신합니다. 월 시작 포함/다음 달 시작 제외, spentOn 내림차순·createdAt 내림차순·id 오름차순 정렬을 공유합니다. 합계는 안전 정수 범위를 검사합니다. 카테고리 막대그래프는 자체 CSS입니다.

의존성 목적: React/DOM은 화면, Dexie/hooks는 로컬 영속성/관찰, Zod는 입력과 백업 검증, Vite/PWA는 정적 빌드/캐시입니다. 테스트·린트·타입 도구는 개발 의존성입니다. 어떤 의존성도 지출 전송 또는 서비스 계정을 요구하지 않습니다.

## 무료 정적 배포 준비

Cloudflare Pages의 React(Vite) 프리셋, 빌드 명령 npm run build, 출력 dist, Node 24 LTS, 프로덕션 브랜치 main을 사용합니다. 무료 기본 *.pages.dev HTTPS 주소를 사용하고 Functions/Workers/DB/R2/유료 도메인은 만들지 않습니다. 배포 시점의 무료 플랜 조건은 [공식 Pages 문서](https://developers.cloudflare.com/pages/)에서 다시 확인하세요.

이 작업에서는 공개 업로드나 계정 생성·실제 배포를 하지 않습니다. 실제 배포는 별도 사용자 승인 후 진행합니다. dist만 배포하고 .env나 개인 JSON이 포함되지 않았는지 확인하세요.

## 실기기 검증 대기

자동 브라우저 검증과 실기기 설치 검증은 다릅니다. Android Chrome 홈 화면 설치/단독 실행/종료·재실행, 실제 iPhone Safari의 설치·다운로드/공유·복원, Safari 탭과 PWA 저장소 차이, 가상 키보드/화면 회전/safe area는 실제 기기에서 확인해야 합니다. Playwright 결과로 iOS 홈 화면 설치를 검증했다고 주장하지 않습니다.

## 검증 결과

Phase 1부터 5까지 단계마다 lint/typecheck/test/build를 실행했습니다. 최종 단위·DB 테스트 29개와 Chrome E2E 15개가 통과했습니다. 프로덕션 오프라인 CRUD, 새로고침 영속성, 백업/복원·롤백, 네트워크 복귀 후 업데이트 승인, 320/375/430px 라이트·다크, 저장소 오류를 확인했습니다. E2E는 4183 포트의 프로덕션 preview를 자동 사용합니다. 상세 단계 보고는 [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md), 실제 실행 로그는 verification/에 있습니다. 실기기/공개 HTTPS 검증은 대기입니다.

## 사용자 설치·사용 안내

앱 상단 ? 또는 설정의 설치·사용 안내 보기에서 안내 페이지를 열 수 있습니다. /#guide로 직접 접속·새로고침할 수 있고, 자산 저장 후 오프라인에서도 열립니다. 설치 방법·3단계 기록·백업/기기 이동·FAQ를 제공합니다. 모바일 배포와 설치 절차는 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)에 정리했습니다. 현재 PC의 localhost 주소를 휴대폰 설치 주소로 사용하지 마세요.
