# 구현 및 검증 보고

작업 위치: D:\backup\vsCodeworkspace\side\account\docs. 루트 AGENTS.md 전체를 먼저 읽었으며 기존 파일은 해당 문서뿐이었습니다. AGENTS.md를 수정하거나 기존 사용자 파일/DB를 삭제하지 않았습니다.

최종 상태: Phase 1~4 구현·자동검증 완료, Phase 5 모바일 PWA 안정화와 정적 배포 준비·자동검증 완료. 실기기 설치와 공개 HTTPS 배포는 미실행입니다. 실기기 검증까지 포함한 전체 출시 완료라고 주장하지 않습니다.

| 단계 | lint | typecheck | 단위/DB 테스트 | build | Chrome 브라우저 검증 |
|---|---|---|---|---|---|
| 1 | 통과 | 통과 | 10개 통과 | 통과 | 빈 앱·IndexedDB probe·SW ready |
| 2 | 통과 | 통과 | 10개 통과 | 통과 | 2개 통과 |
| 3 | 통과 | 통과 | 12개 통과 | 통과 | 3개 통과 |
| 4 | 통과 | 통과 | 19개 통과 | 통과 | 4개 통과 |
| 5 최종 | 통과 | 통과 | 29개 통과 | 통과 | 15개 통과 |

모든 단계에서 npm run lint, npm run typecheck, npm run test, npm run build를 실제 실행했습니다. Node 24.21.0, npm 12.2.0, Playwright 1.64.0, 설치된 Windows Chrome의 headless 실행을 사용했습니다. 최종 테스트 29개/브라우저 테스트 15개가 통과했고 dist/ 및 Manifest·generateSW 산출물이 생성됐습니다. 각 명령의 종료 코드와 원문 로그는 verification/phase-1.json ~ phase-5.json, 브라우저 결과는 phase-1-browser.json 및 phase-2-e2e.json ~ phase-5-e2e.json에 있습니다.

## Phase 1

[현재 Phase]
- 기초 프로젝트·도메인·IndexedDB·PWA 기반.

[구현]
- package.json/package-lock.json, tsconfig.json, eslint.config.js, vite.config.ts: 정확한 안정 버전, strict TypeScript, lint/test/build, prompt PWA.
- src/domain/*, src/shared/utils/dates.ts·money.ts: 정수 금액, 고정 코드, 실제 날짜, trim/null, 현지 날짜·월 범위·안전 정수 합계.
- src/data/db.ts·expenseRepository.ts: 버전 1 Dexie DB, add/update/delete, 없는 ID 오류, 월 경계와 결정적 정렬.
- src/app/App.tsx·main.tsx·styles/global.css, index.html: 모바일 기본 탭·빈 화면.
- public/favicon.svg, apple-touch-icon.png, icons/*: 로컬 192/512/maskable 아이콘.
- tests/domain.test.ts·repository.test.ts: 유효성/CRUD/키 충돌/월 범위.

[검증]
- lint/typecheck/test/build 통과, 테스트 10개. 프로덕션 preview에서 빈 앱, IndexedDB probe DB 생성, service worker ready 확인.
- 초기 UUID 기본 인자 추론 타입 오류를 명시적 string 매개변수로 수정 후 통과.

[안전성/비용]
- 로그인·백엔드·외부 런타임 서비스 없이 정적 자산만 캐시. 비용 요소 없음.

[남은 작업]
- 다음 단계 CRUD 편집 화면으로 진행했으며 아래 단계에서 완료.

## Phase 2

[현재 Phase]
- 지출 등록·수정·삭제.

[구현]
- src/features/expense/ExpenseEditor.tsx·ExpenseList.tsx: 금액→카테고리→저장, 선택 사용처/메모, 오류 후 입력 보존, 저장 lock/비활성화.
- src/shared/components/Modal.tsx, App.tsx: 모달·삭제 확인·미저장 입력 확인, useLiveQuery 갱신.
- playwright.config.ts·e2e/expense-crud.spec.ts: 실제 브라우저 CRUD/재로딩/이탈 취소.

[검증]
- lint/typecheck/test/build 통과. Chrome E2E 2개 통과: CRUD·삭제 취소·새로고침 영속성·편집 이탈 취소.
- ID/생성시각 유지, 중복 ID/없는 ID 처리도 DB 테스트 통과.

[안전성/비용]
- 화면은 Repository를 통해 저장. 삭제 전 명시적 확인. 사용자 기록 외부 전송 없음.

[남은 작업]
- 월별 집계/달력으로 이어 진행했고 다음 단계에서 완료.

## Phase 3

[현재 Phase]
- 홈·월 내역·소비 캘린더.

[구현]
- src/features/home/HomePage.tsx: 총지출·전월 비교·상위 카테고리·최근 5건.
- src/features/history/HistoryPage.tsx·ExpenseCalendar.tsx, src/shared/components/MonthSelector.tsx: 월 이동·실제 일자·일 합계·일자 필터.
- src/features/statistics/statistics.ts: 순수 월/일/카테고리 집계·0원 전월 비교·동률 정렬·안전 합계.
- tests/statistics.test.ts·e2e/calendar.spec.ts: 집계 일치·월 경계.

[검증]
- lint/typecheck/test/build 통과, 테스트 12개. Chrome E2E 3개 통과.
- 12월/1월 데이터 분리, 홈/내역 합계 일치, 날짜 선택을 실제 확인. 윤년과 0원 비교는 단위 테스트 확인.

[안전성/비용]
- 선택 월과 전월만 조회. 더미 대시보드 없음. 차트 라이브러리 없음.

[남은 작업]
- 상세 통계 및 필수 백업/복원으로 진행했고 다음 단계에서 완료.

## Phase 4

[현재 Phase]
- 소비 통계·JSON 백업·전체 교체 복원.

[구현]
- src/features/statistics/StatisticsPage.tsx: CSS 막대·금액·비중·전월 비교.
- src/features/settings/backupSchema.ts·backup.ts: 버전 1/10 MiB/50,000건/모든 필드/중복 UUID 검증, 미리보기, 단일 트랜잭션 clear+bulkAdd, 저장 후 건수·합계 재확인.
- SettingsPage.tsx·src/shared/utils/download.ts: Blob 다운로드/지원 브라우저 파일 공유, 전체 교체 확인, 취소, 로컬 보관·평문·동기화 한계 안내, 마지막 파일 생성시각 설정.
- tests/backup.test.ts·live-query.test.ts·e2e/backup.spec.ts: 왕복·거부·롤백·관찰·다운로드/취소/교체 검증.

[검증]
- lint/typecheck/test/build 통과, 테스트 19개. Chrome E2E 4개 통과.
- 0/1/3건 왕복, 미지원 버전/필드 누락/날짜/금액/카테고리/UUID/중복/초과 크기·건수/파일 읽기 오류 거부.
- 일부 삽입 성공 후 예외 주입하여 기존 데이터 롤백 증명. 복원 취소 후 원본 유지, 성공 교체 후 건수·합계와 화면 재조회 확인.
- 초기 테스트의 Dexie PromiseExtended 타입 및 이름 부분 일치 선택자를 수정 후 통과.

[안전성/비용]
- 파일 파싱/사용자 확인은 DB 트랜잭션 밖. 단일 트랜잭션 교체. 백업 자동 업로드 없음. 실패 UI는 불확실한 데이터 유지 보장을 하지 않음.

[남은 작업]
- iOS 파일 다운로드/공유/복원 실기기 확인은 대기. Phase 5 안정화로 진행.

## Phase 5

[현재 Phase]
- 모바일 안정화·오프라인/업데이트·무료 정적 배포 준비.

[구현]
- App.tsx·ExpenseEditor.tsx: 연결 상태, 네트워크 복귀 시 SW 업데이트 확인, 승인 전 대기, 편집 중 폐기 확인, 저장/복원 중 업데이트 비활성화, 뒤로가기 보호.
- src/shared/components/ErrorBoundary.tsx: 렌더 오류 안내. DB 조회/합계 실패도 빈 DB로 가장하지 않음.
- styles/global.css: 320px+, 44px 하단 탭·버튼, safe-area, 라이트/다크, 포커스.
- vite.config.ts preview.headers: CSP·nosniff·referrer·서비스 워커 no-cache 정적 헤더 준비. CSP는 preview 브라우저 흐름에서 검증.
- e2e/offline.spec.ts·mobile.spec.ts·update.spec.ts: 생산 빌드의 실제 오프라인, 모바일, 저장소 실패, SW 교체.
- README.md: 실행/설치/수동 백업/복원/실기기 한계. .gitignore: 개인 백업·빌드·테스트 임시 파일 제외.

[검증]
- 최종 lint/typecheck/test/build 모두 종료 코드 0. 단위/DB 29개, Chrome E2E 15개 통과.
- 오프라인 새로고침·홈/내역/통계·신규/수정/삭제, 네트워크 복귀 후 새 SW 발견, 승인 전 편집 입력 보존, 취소/승인 업데이트 확인.
- 320/375/430px 각각 라이트/다크에서 수평 잘림 없음, 금액 포커스·Escape 취소·외부 페이지 요청 없음. 320px 편집/설정 PNG도 직접 시각 확인.
- IndexedDB 접근 불가→오류 표시, quota 오류→입력 보존. 서비스 워커 캐시는 정적 자산만 포함.
- 초기 모달 autofocus가 닫기 버튼에 빼앗기는 문제를 발견하여 showModal 후 금액 입력 포커스로 수정하고 6가지 조합 재검증 통과.
- 소스에 fetch/XHR/WebSocket/sendBeacon/위험 HTML 삽입 없음. dist에는 .env·개인 백업 없음.

[안전성/비용]
- 실제 기록은 IndexedDB만 사용, 설정 시각만 localStorage. 계정/서버/유료 서비스/텔레메트리 없음. 로컬 테스트 서버는 개발 검증용이며 제품 백엔드가 아님.
- 공개 업로드·계정 생성·실제 배포는 하지 않았음. 무료 Pages 배포 설정만 준비.

[남은 작업]
- 실제 Android Chrome HTTPS 설치·단독 실행·종료/재실행.
- 실제 iPhone Safari 설치·백업 다운로드/공유·복원 및 Safari 탭/PWA 저장소 차이.
- 실기기 가상 키보드·회전·safe area·장기 사용·시크릿 모드 등 모바일 확인.
- 사용자가 별도 승인하면 무료 정적 호스팅 배포 후 실제 HTTPS 환경 점검.
- Git 저장소가 이 작업 폴더에 없어 커밋은 수행하지 않음. package-lock.json은 생성되어 버전 관리에 포함할 준비가 됨.

## 환경 메모

기본 터미널은 helper_unknown_error로 시작되지 않았습니다. 사용 가능한 Node 런타임과 작업 폴더의 임시 npm CLI로 실제 스크립트를 실행했습니다. 전역 런타임·시스템 설정을 수정하지 않았습니다. npm 설치의 간접 glob 의존성 폐기 경고가 있었으며 설치·빌드 실패는 없었습니다. 임시 실행 도구는 .tools/로 Git/배포에서 제외됩니다.

## 추가 작업 · 설치/사용 안내 페이지

- src/features/guide/GuidePage.tsx: 앱 소개, Android/iPhone 선택, 설치 3단계, 기록·오프라인·백업·기기 이동, FAQ. 기존 로컬 데이터 변경 없음.
- App.tsx: 상단 ? 및 /#guide 직접 접속·새로고침, 홈/설정 복귀. SettingsPage.tsx: 설치·사용 안내 진입 버튼. global.css: 모바일/다크 안내 스타일.
- lint/typecheck/test/build 실제 실행 모두 통과. 단위/DB 29개, Chrome E2E 17개 통과. 새 안내를 320px 라이트/다크 및 오프라인 새로고침에서 확인했고 화면 PNG도 시각 확인. 로그: verification/guide-checks.json, guide-e2e.json.
- 추가 의존성·서버·개인 데이터 업로드 없음. 실제 공개 배포와 Android/iPhone 실기기 설치 검증은 대기.

## 추가 작업 · 기록 보관 주의사항

설정의 기록 보관과 백업, 사용 안내의 내 기록 지키기에 공통 StorageNotice 정보란을 추가했습니다. 일반 모드의 종료/재실행에는 기록이 유지된다는 설명, 사이트 데이터 삭제, 시크릿/개인정보 보호 모드 종료, 사용 환경 변경, 저장소 정리, 사전 JSON 백업을 안내합니다. 모드를 임의로 감지하거나 데이터 저장 방식을 바꾸지 않습니다. lint/typecheck/test/build 통과, 기존 안내 E2E 라이트/다크 2개 통과. 로그: verification/storage-notice-checks.json, storage-notice-e2e.json.
