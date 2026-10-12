# AGENTS.md — Pocket Expense (React + TypeScript PWA)

> **목적:** 이 문서는 Codex가 Pocket Expense 저장소에서 개발할 때 최우선으로 따를 제품 명세, 아키텍처, 구현 규칙, 검증 기준이다.
>
> **최종 요구사항:** 혼자 스마트폰(Android 또는 iPhone)에서 사용하는 **수동 입력형 지출 전용 가계부**. **서버·회원가입·앱스토어 없이**, 무료 정적 호스팅에 올리고 홈 화면에 설치하는 PWA로 만든다.
>
> **기준일:** 2026-10-12 | **언어:** TypeScript | **UI:** React | **저장소:** IndexedDB | **기본 언어/통화:** 한국어/KRW

## 0. Codex에게 주는 최우선 지시

1. **사용자 데이터와 비용 최소화를 최우선**으로 한다. 수입·계좌·자산·투자 기능을 만들지 않는다. 로그인/백엔드/클라우드 DB/유료 API/텔레메트리를 추가하지 않는다.
2. **Android 네이티브 앱, iOS 네이티브 앱을 만들지 않는다.** 목적은 Android Chrome 및 iPhone Safari에서 접속·홈 화면에 추가해 사용할 수 있는 **하나의 웹앱(PWA)** 이다. Kotlin/Compose/Room/Gradle/Xcode/Capacitor는 이번 MVP의 기술 스택이 아니다.
3. 저장소가 비어 있으면 **Vite + React + TypeScript**로 초기화한다. 기존 코드가 있으면 먼저 조사하고, 사용 가능한 데이터/기능을 보존하면서 변경한다. 파일이나 사용자 데이터의 무단 삭제는 금지한다.
4. **1인·단일 기기·오프라인 우선**을 기본 가정으로 한다. 다른 기기나 Safari 탭과 PWA 설치본 간 데이터 동기화를 약속하지 않는다. 백업 파일을 다른 기기로 수동 이동·복원할 수 있다.
5. **백업/복원은 출시 필수 기능**이다. 브라우저의 IndexedDB는 영구 저장 보장이 없으며, 기기 변경·브라우저 데이터 삭제·저장소 정리로 유실될 수 있다. 저장소 API의 지속 저장 요청이 성공해도 수동 백업 필요성이 사라지지 않는다.
6. **사용자 실제 지출 정보는 로컬 IndexedDB에만 저장**한다. 네트워크 업로드, 제3자 전송, 로그/분석 전송, 외부 폰트/차트 CDN을 금지한다. 서비스 워커 캐시는 앱 정적 자산에 한정한다.
7. 정식 배포 전까지 **무과금 설계**를 유지한다. Cloudflare Pages 같은 무료 정적 호스팅이 기본 배포 대상이며, 유료 도메인·서버·배포 계정 생성은 사용자 명시적 승인 없이 수행하지 않는다.
8. 기능 구현은 **Phase 1 → 2 → 3 → 4 → 5** 순서로 진행하되, 매 단계에서 실행 가능한 상태로 만들고 lint/typecheck/test/build를 수행한다. 검증하지 않은 기능은 성공했다고 보고하지 않는다.
9. 의존성은 **실제 설치 가능한 안정 버전**을 사용하고 lockfile(`package-lock.json`)을 커밋한다. 버전을 추측하거나 무조건 `latest`로 장기간 방치하지 않는다. Node.js는 선택 버전의 Vite와 vite-plugin-pwa 요구 조건을 충족하는 지원 중인 LTS를 사용하며 README에 명시한다.
10. 더 큰 아키텍처보다 **안정적인 CRUD, 모바일 입력 편의성, 정확한 통계, 데이터 복구 가능성**을 우선한다. 사용자 지시가 없는 한 범위를 임의로 확장하지 않는다.
11. `AGENTS.md`는 Codex 실행 계약이다. 상세 구현 사항이 충돌하면 **사용자의 최신 지시 → 이 문서 → 현재 코드 관례** 순서로 판단하고 결정 이유를 보고한다.
12. 외부 서비스에 실제 업로드하거나 공개 배포하는 행위는 **사용자의 별도 승인 후**에만 실행한다. 로컬 빌드, 미리보기, 배포 설정 파일 작성은 허용한다.

---

## 1. 제품 목표 및 범위

### 1.1 제품 정의

- **서비스 가칭:** Pocket Expense (화면 표기: `나의 지출`)
- **목표 사용자:** 본인 한 사람
- **설치/실행:** 모바일 브라우저 + 홈 화면 추가(PWA), 별도 앱 마켓 필요 없음
- **핵심 경험:** **금액 → 카테고리 → 저장**, 선택 정보는 날짜/사용처/메모
- **네트워크:** 최초 로드 및 업데이트 때 필요; 오프라인 자산 캐시 후 주요 화면 및 CRUD는 인터넷 없이 동작
- **영속성:** 브라우저 내 IndexedDB, 필수 JSON 백업·복원
- **통화:** KRW(원), 소수점 지출 없음
- **디자인:** 터치 우선 모바일 UI, 한국어, 밝은/어두운 테마 대응
- **비용 목표:** 무료 플랜 한도 내 월 서버·DB·도메인 비용 0원(별도 구매/초과 사용 제외)

### 1.2 기능 요구사항과 완료 기준

| ID    | 기능          | 검증 가능한 완료 기준                                        | 우선순위 |
| ----- | ------------- | ------------------------------------------------------------ | -------- |
| FR-01 | 지출 등록     | 금액·카테고리·날짜 필수값을 검증하고 저장; 목록/합계 즉시 반영 | P0       |
| FR-02 | 지출 수정     | 기존 항목의 금액·카테고리·날짜·사용처·메모 수정; ID/생성시각 유지 | P0       |
| FR-03 | 지출 삭제     | 삭제 확인 후 정확한 ID 삭제; 집계 갱신                       | P0       |
| FR-04 | 월별 내역     | 이전/다음 달 선택; 날짜 내림차순·생성시각 내림차순 정렬      | P0       |
| FR-05 | 소비 캘린더   | 날짜별 합계; 날짜 클릭 시 해당 일자의 내역                   | P0       |
| FR-06 | 월별 통계     | 카테고리별 금액·비중; 카테고리 합계 = 월 합계                | P0       |
| FR-07 | 전월 비교     | 이번 달/전월 합계, 증감액, 전월 0원 예외 처리                | P0       |
| FR-08 | 오프라인 사용 | 온라인 최초 접속·SW 설치 이후 새로고침 및 CRUD를 오프라인에서도 수행 | P0       |
| FR-09 | JSON 백업     | 최신 데이터를 버전이 포함된 파일로 내보내고 다운로드/공유 가능 | **P0**   |
| FR-10 | JSON 복원     | 파일 검증 → 미리보기·확인 → 트랜잭션 교체 → 결과 확인        | **P0**   |
| FR-11 | 설치 안내     | Android Chrome, iPhone Safari에서 홈 화면 추가 방법 제공     | P1       |
| FR-12 | 접근성·반응형 | 320px 이상 주요 화면에서 조작 가능, 명확한 포커스/라벨       | P1       |

**MVP 필수 범위:** P0 전부 + 설치/기본 접근성 검증. 다크모드 등 표현 개선은 필수 기능이 안정화된 이후 적용한다.

### 1.3 MVP 비범위 — 절대 임의 추가 금지

- 수입, 잔액, 자산/투자, 은행/카드/계좌 연결, 카드 알림·문자 자동 수집, OCR
- 회원가입/로그인/OAuth, Spring Boot, Node.js API 서버, Firebase/Supabase DB, 클라우드 동기화
- 사용량 분석/광고/알림/푸시/AI 추천/결제/유료 구독
- 사용자별 가계부 공유, 다중 기기 자동 동기화, 실시간 백업
- 반복 지출, 예산 관리, 커스텀 카테고리, 다국어
- Google Play/App Store 제출, APK/AAB/IPA 제작

---

## 2. 권장 기술 스택

| 항목           | 기술                                         | 선택 이유/제한                                               |
| -------------- | -------------------------------------------- | ------------------------------------------------------------ |
| 언어           | TypeScript (`strict: true`)                  | 데이터 타입 안전성                                           |
| 프레임워크     | React + Vite                                 | 단일 SPA, 정적 빌드                                          |
| PWA            | `vite-plugin-pwa`                            | Manifest + Service Worker/Workbox 구성                       |
| 로컬 DB        | `dexie` (IndexedDB)                          | 타입 안전한 브라우저 영속성 및 트랜잭션                      |
| 반응형 DB 조회 | `dexie-react-hooks` (`useLiveQuery`)         | DB 변경 시 React 뷰 갱신                                     |
| 스키마 검증    | `zod`                                        | 폼 및 JSON 복원 파일 런타임 검증                             |
| 날짜           | 브라우저 Date + 자체 날짜 유틸               | ISO 날짜/월 경계 통일; 불필요한 날짜 의존성 금지             |
| 라우팅         | 가벼운 탭 상태 또는 `react-router-dom`       | 단순 화면; 사용 사례로 필요할 때만 선택                      |
| 스타일         | CSS Modules 또는 프로젝트 내 순수 CSS        | 모바일 우선; 거대한 UI 프레임워크 지양                       |
| 아이콘         | 직접 포함 SVG / 필요 시 설치형 아이콘 패키지 | 외부 CDN 호출 금지                                           |
| 테스트         | Vitest, Testing Library, `fake-indexeddb`    | 로직·컴포넌트·IndexedDB 테스트                               |
| E2E/브라우저   | Playwright (개발 의존성)                     | 모바일 viewport, CRUD, 오프라인 경로 검증                    |
| 호스팅         | Cloudflare Pages(정적 파일만)                | 무료 기본 `*.pages.dev` 주소, 서버리스가 아닌 순수 정적 호스팅 |
| 런타임 서버    | **없음**                                     | 사용자 지출 데이터를 저장하는 서버가 없음                    |

- 필요 없는 전역 상태 관리(Zustand/Redux), API 클라이언트(Axios/React Query), ORM, 백엔드 런타임을 임의 설치하지 않는다.
- Tailwind나 shadcn/ui는 **필수 아님**. 기본은 읽기 좋은 자체 CSS로 구현한다.
- 외부 차트 라이브러리 없이 CSS 막대그래프로 카테고리 분석을 구현한다.
- 현재 설치된 버전과 공개된 공식 문서 기준으로 호환성을 검증한다.

### 2.1 PWA 적용 규칙

1. Manifest: `name`, `short_name`, `start_url`, `scope`, `display: standalone`, `theme_color`, `background_color`, 192/512 아이콘, 가능한 maskable 아이콘 설정.
2. `vite-plugin-pwa`의 `generateSW` 전략을 우선 사용하고 **`registerType: 'prompt'`** 를 채택한다. 입력 중 강제 새로고침해 미저장 데이터를 잃지 않도록 업데이트를 사용자 동의로 적용한다.
3. 앱 셸(HTML, JS, CSS, 로컬 폰트/이미지)은 precache. 사용자가 가진 지출 데이터와 JSON 백업 파일을 Service Worker Cache Storage에 넣지 않는다.
4. 배포 시 **HTTPS 필수**(로컬 개발의 `localhost`는 예외); 무료 호스팅 기본 도메인의 HTTPS 이용.
5. 오프라인 테스트는 `vite dev`만으로 검증하지 않고 **프로덕션 `build` + `preview`** 또는 배포 환경에서 검증한다.
6. Service Worker 업데이트 전에는 편집 중인지 확인하고 적절한 UI로 저장 또는 취소를 안내한다.
7. 앱 내부 기본 탐색을 오프라인에서도 지원하고, 라우팅을 도입한 경우 새로고침/직접 URL 접근에 대한 SPA fallback도 검증한다.
8. 브라우저 환경에서 `navigator.storage.persist()` 지원 여부를 확인하고 적절하면 요청할 수 있으나, 거절/미지원은 정상 경로로 처리한다. **지속 저장 API가 데이터 보증이나 백업을 대체하지 않는다.**

---

## 3. 화면 및 사용자 경험

### 3.1 네비게이션

하단 3탭: `홈 / 내역 / 통계`; 모든 주요 탭에서 지출 추가를 쉽게 시작하는 `+` 버튼. 보조 `설정/백업`은 우측 상단 메뉴 또는 별도 설정 화면으로 접근한다.

- 하단 탭/저장 버튼은 터치 대상 최소 약 44×44 CSS px 확보.
- 뷰포트 안전 영역(`env(safe-area-inset-bottom)`)을 고려해 iPhone 홈바와 버튼이 겹치지 않도록 한다.
- 입력 화면에서 값 없는 필드는 최소화하고 저장까지 스크롤·탭 수를 줄인다.
- 일관된 숫자 포맷(`Intl.NumberFormat('ko-KR')`)과 한국어 설명 사용.
- 키보드 열림, 배율 확대, 작은 화면에서 레이아웃 잘림 없이 작동해야 한다.

### 3.2 홈(Home)

- 사용자 기기 **현재 월** 기본 선택.
- 월 총지출/전월 대비 변화, 지출 상위 카테고리, 최근 지출 5건.
- 지출이 0건이면 `아직 지출 기록이 없어요` + `지출 추가` 안내.
- 총액·카테고리 통계는 실제 IndexedDB 데이터로만 계산; 더미 데이터는 테스트/개발 데모에 한정.

### 3.3 내역(History)

- 이전/다음 월 이동, 해당 월의 달력, 날짜별 총지출.
- 달력 날짜 선택 시 해당 날짜의 지출 목록을 보여준다.
- 기록 선택 → 상세/수정; 삭제는 확인 다이얼로그 필요.
- 금액 없는 날짜마다 `0원`을 나열하지 않고 차분하게 표현.

### 3.4 통계(Statistics)

- 선택한 월 지출 총합, 카테고리별 금액 및 비중.
- 카테고리별 금액 내림차순, 동률 시 정해진 기본 카테고리 순서.
- CSS 막대그래프와 금액을 동시에 표기; 색상만으로 구분하지 않는다.
- 전월 0원인 경우 증감률 대신 `비교 불가` 표시.
- 지출이 없는 경우 빈 상태 및 0으로 나누기 방지.

### 3.5 지출 등록/수정(Editor)

- 필수: 금액(원 단위 양의 정수), 카테고리, 지출 날짜(기본 오늘).
- 선택: 사용처(최대 100자), 메모(최대 200자).
- 금액 입력에는 `inputMode="numeric"`을 지정하고 천 단위 콤마는 **표시 계층**에서만 적용한다.
- 저장 중 버튼 비활성화 및 중복 탭 방지. 실패하면 입력값을 보존한다.
- 수정 시 원본 값을 로드하고 ID·생성시각을 유지한다.
- 편집 중 미저장 입력이 있는 상태에서 닫기/뒤로 가기/업데이트를 선택하면 확인을 요구한다.

### 3.6 설정 및 백업(필수)

- `JSON 백업 내보내기`, `JSON 백업에서 복원` 2개 액션.
- 로컬 보관 안내: “기록은 이 기기의 브라우저에 저장됩니다. 기기 변경·브라우저 데이터 삭제 시 사라질 수 있으므로 백업 파일을 안전하게 보관하세요.”
- 사용자에게 수동 백업을 권장하되 강제 알림 스팸을 만들지 않는다. 가능하면 마지막 성공 백업 시각 표시(해당 시각은 로컬 설정 데이터).
- iPhone에서 홈 화면에 추가한 앱과 Safari 브라우저 탭의 저장소가 별개일 수 있다는 안내를 간결히 제공한다.
- 초기 화면에는 PWA 설치 방법을 과도하게 강요하지 않는다. `설치 안내`에서 OS/브라우저별 방법 제공.

---

## 4. 디렉터리 구조

**한 개의 웹 프로젝트로 시작한다.** 실제 Vite 템플릿이 생성한 파일을 따르되 다음 구조를 권장한다.

```text
pocket-expense/
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── index.html
├── vite.config.ts
├── tsconfig.json                 # 필요 시 app/node 설정 분리
├── eslint.config.js
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── icon-maskable-512.png
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx            # 실제 라우터를 쓰는 경우만
│   │   └── AppShell.tsx
│   ├── domain/
│   │   ├── expense.ts
│   │   ├── expenseCategory.ts
│   │   ├── expenseSchema.ts
│   │   └── expenseRules.ts
│   ├── data/
│   │   ├── db.ts                 # Dexie 스키마 및 버전 관리
│   │   ├── expenseRepository.ts
│   │   └── expenseRepositoryImpl.ts
│   ├── features/
│   │   ├── home/
│   │   │   ├── HomePage.tsx
│   │   │   └── useHomeData.ts
│   │   ├── expense/
│   │   │   ├── ExpenseEditor.tsx
│   │   │   ├── ExpenseList.tsx
│   │   │   └── useExpenseActions.ts
│   │   ├── history/
│   │   │   ├── HistoryPage.tsx
│   │   │   └── ExpenseCalendar.tsx
│   │   ├── statistics/
│   │   │   ├── StatisticsPage.tsx
│   │   │   └── statistics.ts
│   │   └── settings/
│   │       ├── SettingsPage.tsx
│   │       ├── backup.ts
│   │       └── backupSchema.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── BottomNav.tsx
│   │   │   ├── MonthSelector.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── hooks/
│   │   └── utils/
│   │       ├── dates.ts
│   │       ├── money.ts
│   │       └── download.ts
│   ├── styles/
│   │   ├── global.css
│   │   └── tokens.css
│   └── vite-env.d.ts
├── tests/
│   ├── setup.ts
│   ├── domain/
│   ├── data/
│   └── backup/
└── e2e/
    ├── expense-crud.spec.ts
    └── offline.spec.ts
```

- 공통 UI 컴포넌트는 `shared/`, 서비스별 화면/로직은 `features/`에 둔다.
- 화면 컴포넌트에서 Dexie 테이블을 직접 수정하지 말고 Repository/API 함수에 위임한다.
- 차트 계산이나 검증 로직을 여러 컴포넌트에 복붙하지 않는다.
- 별도 `backend/`, `server/`, `androidApp/`, `iosApp/` 디렉터리를 새로 만들지 않는다.

### 4.1 데이터 흐름

```text
React Screen
  ↓ form submit / click
Feature hook / action
  ↓ validate (Zod + domain rules)
ExpenseRepository
  ↓ Dexie transaction/query
IndexedDB  ← 기기에만 데이터 저장
  ↓ Dexie useLiveQuery (reactive query)
React Screen / 월별 통계 갱신
```

백업/복원은 별도 경로:

```text
내보내기: IndexedDB snapshot → versioned JSON → Blob → 사용자 다운로드
가져오기: 사용자 파일 → 크기 제한 → JSON.parse → 스키마 검증
          → 내용 미리보기 + 명시적 확인 → Dexie transaction(replace)
          → 검증/최신 조회 → 복원 완료 안내
```

---

## 5. 데이터 모델 및 정확성 규칙

### 5.1 고정 카테고리

| 저장 코드 | 화면 라벨 |
| --------- | --------- |
| FOOD      | 식비      |
| CAFE      | 카페      |
| TRANSPORT | 교통      |
| SHOPPING  | 쇼핑      |
| LIVING    | 생활      |
| HOUSING   | 주거      |
| MEDICAL   | 의료      |
| OTHER     | 기타      |

카테고리 코드만 IndexedDB에 저장한다. 라벨은 UI에서 매핑하므로 향후 UI 이름이 변경되어도 기존 데이터는 유지되어야 한다.

### 5.2 Expense 타입

```ts
export const EXPENSE_CATEGORIES = [
  'FOOD', 'CAFE', 'TRANSPORT', 'SHOPPING',
  'LIVING', 'HOUSING', 'MEDICAL', 'OTHER',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface Expense {
  id: string;              // UUID, crypto.randomUUID()
  amount: number;          // 양의 정수 KRW; 1..999_999_999
  categoryCode: ExpenseCategory;
  spentOn: string;         // YYYY-MM-DD, 사용자가 선택한 현지 달력 날짜
  merchant: string | null; // 선택, 최대 100자
  memo: string | null;     // 선택, 최대 200자
  createdAt: number;       // Date.now(), epoch milliseconds
  updatedAt: number;       // Date.now(), epoch milliseconds
}
```

- JS `number`를 사용하되 **정수만** 허용한다 (`Number.isSafeInteger`). 지출 1회 상한은 `999_999_999`원. 음수·0원·소수점·NaN·Infinity 불가.
- 통계 총합 역시 `Number.isSafeInteger` 범위 내인지 검증하고 안전 범위를 벗어나면 잘못된 숫자를 보여주지 않는다.
- 신규 ID는 HTTPS/localhost 같은 secure context에서 `crypto.randomUUID()`로 생성한다.
- `spentOn`은 현지 달력 날짜로 취급하고 `new Date('YYYY-MM-DD').toISOString()` 같은 UTC 변환으로 날짜를 밀지 않는다.
- 날짜는 `YYYY-MM-DD` 정규식만으로 검사하지 않는다. 해당 연월일이 실제 존재하는지(예: 2026-02-30 거부) 검증한다.
- `createdAt`, `updatedAt`은 숫자 epoch ms; 업데이트할 때 `createdAt` 불변, `updatedAt`만 갱신.
- 사용처·메모는 trim 후 빈 문자열이면 `null`로 정규화한다.

### 5.3 IndexedDB (Dexie) 정의

```ts
import Dexie, { type EntityTable } from 'dexie';
import type { Expense } from '../domain/expense';

export class PocketExpenseDatabase extends Dexie {
  expenses!: EntityTable<Expense, 'id'>;

  constructor() {
    super('pocket-expense-db');
    this.version(1).stores({
      expenses: 'id, spentOn, categoryCode, [spentOn+categoryCode], createdAt',
    });
  }
}

export const db = new PocketExpenseDatabase();
```

- 사용한 Dexie 버전의 정확한 `EntityTable` 지원 여부를 확인하고, 버전에서 권장하는 타입 패턴에 맞춰 컴파일될 것.
- `id`는 앱이 생성하는 문자열 키. 신규 등록에서 동일 ID가 있으면 `add()`가 오류를 발생하도록 하며 **조용한 덮어쓰기 금지**.
- 수정은 `update(id, changes)` 방식으로 기존 ID 존재 여부를 확인한다. 없으면 명시적 NotFound 오류.
- 미래에 스키마 변경 시 Dexie 버전을 올리고 `upgrade()` 마이그레이션을 작성한다. `db.delete()`로 전 버전을 초기화하는 방식 금지.
- 신규 데이터 등록·수정·삭제는 브라우저에서 원자적 트랜잭션을 사용하거나 Dexie의 단일 원자적 오퍼레이션을 사용한다.

### 5.4 날짜·월 범위 조회

월 조회는 **시작일 포함 / 다음 달 시작일 미포함** 규칙이다.

- 2026년 10월: `2026-10-01` <= `spentOn` < `2026-11-01`
- 2026년 12월: `2026-12-01` <= `spentOn` < `2027-01-01`
- 문자열로 저장한 ISO 날짜에는 반드시 0-padding을 적용해 사전식 정렬과 시간순 정렬을 일치시킨다.
- 날짜·월 계산은 브라우저 **현지 캘린더** 기준으로 구현한다. `toISOString().slice(0, 10)`으로 오늘 날짜를 구하지 않는다(UTC 날짜 오차 위험).
- Dexie는 `where('spentOn').between(start, endExclusive, true, false)`와 같은 범위 조회를 사용할 수 있다.
- 내역 정렬: `spentOn DESC`, 동률일 때 `createdAt DESC`, 그다음 `id`를 deterministic tiebreaker로 사용.
- 홈/내역/통계에서 같은 기간 계산 함수와 동일한 필터링 규칙을 공유한다.

### 5.5 통계 규칙

- 월별 총지출 = 선택 월 모든 지출 `amount` 합계.
- 일별 총지출 = 선택 일자 합계.
- 카테고리별 총지출 = 선택 월 각 코드별 합계.
- 카테고리 비율 = `(categoryTotal / monthlyTotal) * 100`. 0원이면 0%.
- 전월 증감액 = `이번 달 총지출 - 전월 총지출`.
- 전월 증감률 = `((이번 달 - 전월) / 전월) * 100`; 전월이 0원이면 **`비교 불가`** 로 표시(가짜 100% 금지).
- 금액이 정확한 값이며 %는 화면용 반올림 표시; 비율 반올림 합계가 정확히 100%일 필요는 없다.
- 1인 MVP에서는 선택 월 자료만 조회한 뒤 순수 함수에서 집계할 수 있다. 전체 기간 데이터를 매번 메모리로 읽지 않는다.
- 통계 계산 로직은 테스트 가능한 순수 함수로 분리한다.

---

## 6. 백업·복원 규칙 — 데이터 안전성 우선

### 6.1 백업 JSON 계약

**정해진 버전 포함 JSON 포맷**을 직접 관리한다. 향후 자동/수동 마이그레이션이 가능하도록 `schemaVersion`을 명시한다.

```json
{
  "format": "pocket-expense-backup",
  "schemaVersion": 1,
  "exportedAt": "2026-10-12T00:00:00.000Z",
  "expenses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 12000,
      "categoryCode": "FOOD",
      "spentOn": "2026-10-12",
      "merchant": "식당",
      "memo": null,
      "createdAt": 1791763200000,
      "updatedAt": 1791763200000
    }
  ]
}
```

- **예시 데이터만** 위 JSON에 포함한다. 프로덕션에서 테스트 데이터를 자동 저장하지 않는다.
- 파일명 예: `pocket-expense-backup-2026-10-12.json`.
- 다운로드 방식은 지원 브라우저에서 `Blob` + 객체 URL + 클릭을 우선하되, iOS 공유 시트 등 플랫폼별 UX를 실기기로 검증한다.
- 파일은 평문 JSON이므로 **금융 관련 개인 기록이 포함됨**을 사용자에게 설명한다. 자동 외부 전송 금지.
- 파일은 계정/백엔드에 보관하지 않는다. 사용자가 직접 파일 앱 또는 개인 클라우드로 옮기는 행위만 허용한다.

### 6.2 복원 파이프라인

1. 사용자가 `.json` 파일을 직접 선택한다.
2. 파일 최대 크기를 **10 MiB**로 제한하고, 크기 초과·읽기 오류·잘못된 JSON에 대한 오류 UI를 제공한다.
3. `format`, 지원하는 `schemaVersion`, `exportedAt`, `expenses`와 **각 행의 모든 필드**를 Zod 등 런타임 검사로 검증한다. 배열은 예를 들어 최대 **50,000건**으로 제한하고 ID 중복/날짜 유효성/금액 범위를 검사한다.
4. 파일 검증이 끝난 후 레코드 수·대상 기간·현재 로컬 레코드 수 등을 보여주고 **기존 데이터 전체를 교체**한다는 점을 명시한다. 초기 정책은 **덮어쓰기 교체(Replace All)** 뿐이며 병합은 구현하지 않는다.
5. 사용자에게 `복원하면 현재 지출 기록이 교체됩니다. 기존 데이터를 먼저 백업했나요?` 확인을 요구한다. 취소 시 변경하지 않는다.
6. 복원 시 `db.transaction('rw', db.expenses, async () => { await db.expenses.clear(); await db.expenses.bulkAdd(validatedExpenses); })`와 동등한 **단일 IndexedDB 트랜잭션**을 사용한다. 중도 실패는 롤백되어야 한다.
7. 복원이 완료된 뒤 실제 저장된 레코드 수/합계 또는 주요 레코드를 재조회하고 완료를 안내한다. 실패 시 `복원에 실패했으며 기존 데이터가 유지되었습니다`라는 메시지는 **트랜잭션 롤백을 검증할 때에만** 표시한다.
8. `backupSchema`가 지원하지 않는 버전은 **거절**, 추측으로 내용을 고쳐 넣지 않는다.
9. 파일 파싱/검증이나 사용자 확인을 **DB 트랜잭션 바깥**에서 수행해 트랜잭션이 불필요하게 열린 채 대기하지 않도록 한다.
10. 데이터 저장·복원 에러 메시지에 기록 내용/금액/사용처를 콘솔로 덤프하지 않는다.

### 6.3 브라우저 저장소 안내

- IndexedDB는 로컬 브라우저 저장소로, 브라우저 설정 삭제, 사파리 저장 정책, 장기간 미사용, 저장소 부족 등의 경우 데이터가 사라질 수 있다.
- iPhone의 **Safari 웹사이트 탭**과 **홈 화면에서 실행한 PWA**가 서로 다른 저장소를 가질 수 있다. 데이터 공유를 보장하거나 자동 동기화된다고 안내하지 않는다.
- 개인 기기에서 설치 후 계속 **같은 홈 화면 아이콘**으로 접속하는 사용법을 권장한다.
- 새 기기/다른 설치본에서는 직접 내보낸 JSON을 **수동 복원**하도록 안내한다.
- `localStorage`는 설정(예: 마지막 백업 일시)만 저장할 때 선택적으로 사용 가능; 지출 레코드 본문 저장 금지.

---

## 7. 보안·개인정보·비용 정책

1. **개인 데이터 외부 전송 금지:** 결제/소비 기록을 fetch/XHR/WebSocket, 로그 분석 SaaS, 오류 수집 서비스, 광고 스크립트로 전송하지 않는다.
2. **서드파티 런타임 호출 금지:** 외부 Google Fonts/CDN/API/analytics/script가 프로덕션 실행 시 네트워크에서 로드되지 않도록 한다. npm 설치/배포 빌드 단계 네트워크는 예외다.
3. React의 기본 문자열 이스케이프를 사용하며 사용처/메모에 `dangerouslySetInnerHTML`을 사용하지 않는다.
4. 별도 서버·쿠키·사용자 인증이 없다는 점을 정확하게 알린다. **URL이 비밀이거나 사용자 데이터가 서버에 저장되기 때문에 안전한 구조가 아니다.** 데이터는 개인 기기에 저장될 뿐이다.
5. 정적 배포에서 가능한 경우 보안 헤더(CSP 등)를 검토하되, Workbox/서비스워커/PWA 정상 동작을 망치지 않도록 실제 검증한다.
6. 공개 Git 저장소에 개인 백업 JSON이나 실제 지출 내역을 커밋하지 않는다. `.gitignore`에 예시 경로를 추가하고 문서에 안내한다.
7. **추가 과금 요소 금지:** DB 서버, Functions, Workers, R2, 외부 유료 서비스, 유료 도메인 사용을 임의 활성화하지 않는다.
8. 무료 플랜 제공/조건은 변경될 수 있다. `월 0원`은 기본 무료 범위와 별도 결제 없는 사용을 전제로 한다.

---

## 8. 테스트 및 품질 기준

### 8.1 단위 테스트 — 필수

- 금액 `0`, 음수, 소수, `NaN`, `Infinity`, 상한 초과, 비정수 입력 거부.
- 카테고리 8개 코드만 허용.
- 사용처 최대 100자, 메모 최대 200자, trim/빈 문자열 정규화.
- 잘못된 날짜(`2026-02-30`), 2028 윤년 2월, 12월→1월 월 범위 처리.
- 현재 날짜 생성 시 UTC·현지 시간대 차이로 지출일 하루 밀리지 않음.
- 월 합계: `[12000, 5500, 1550] = 19050`.
- 날짜별/카테고리별 합계와 전체 월 합계 일치.
- 전월 0원 → `비교 불가`, 전월 100,000원·이번 달 80,000원 → -20%.
- 합계 안전 정수 범위 검사.

### 8.2 DB 통합 테스트 — 필수

- fake-indexeddb 등에서 create/read/update/delete.
- 동일 ID 두 번 생성 시 덮어쓰지 않고 실패.
- 없는 ID 수정 시 명시적 실패.
- 월 경계(시작 포함, 다음 달 시작 제외), 정렬, 카테고리 합계.
- Dexie `useLiveQuery` 연동 UI 반영 또는 동등한 관찰 로직 테스트.
- 새로고침 후 영속성은 **실제 브라우저 E2E**로도 검증(fake-indexeddb는 프로세스/페이지 수명 제약이 있음).

### 8.3 백업/복원 테스트 — 필수

- 데이터 0건/1건/다수 건 내보내기 및 다시 가져오기 왕복 일치.
- `schemaVersion` 알 수 없음, 빈 파일, 깨진 JSON, 10MiB 초과, 과다 레코드 거부.
- 잘못된 금액·날짜·카테고리·UUID/중복 ID/필드 누락 거부.
- 복원 취소 시 기존 데이터 그대로 유지.
- 일부 레코드 삽입 중 예외를 발생시켜 **트랜잭션 롤백**을 증명.
- 성공 복원 후 저장 건수와 합계가 파일 내용과 일치.
- 다른 기기나 iOS 설치본에서 자동 동기화가 일어나지 않는다는 안내 표시 검증.

### 8.4 PWA 및 모바일 수동 테스트 — 필수

- Android Chrome: HTTPS 접속 → 홈 화면 추가 → 단독 실행 → CRUD → 종료/재실행 확인.
- iOS Safari(실기기 가능할 때): Safari 공유 메뉴 → 홈 화면에 추가 → 저장/재실행 → 백업 다운로드/복원.
- iOS PWA 설치본과 Safari 탭의 데이터 저장 영역 차이를 실제로 검증하고 README에 기록.
- 정적 자산 첫 로드 후 네트워크 차단 → 홈/내역/통계 조회, 신규/수정/삭제 모두 가능.
- 네트워크 복귀 후 새 버전 발견 시 사용자가 선택해 앱 업데이트할 수 있으며, 편집 중 내용이 강제로 유실되지 않는다.
- 320px·375px·430px 모바일 너비, 라이트/다크 UI, 화면 회전, 키보드·safe area 확인.
- 브라우저 시크릿 모드/IndexedDB 접근 불가/저장용량 초과 시 빈 기록처럼 보이지 않고 명확한 오류·안내 표시.
- 실제 iPhone 테스트가 불가능하면 Playwright WebKit 결과만으로 iOS 홈 화면 설치 지원을 검증했다고 주장하지 않는다.

### 8.5 Definition of Done

모든 Phase에서:

- 요구사항과 코드가 일치하며 제품 범위가 확장되지 않았다.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`를 실제 실행했다(설정된 스크립트 기준).
- 실패·미실행은 사실대로 보고하고 오류 로그의 핵심 내용 및 사유를 명시한다.
- 실데이터 대신 하드코딩된 샘플로 대시보드를 그리지 않는다.
- 새로운 의존성의 목적과 비용·개인정보 영향이 설명되어 있다.
- README의 실행/설치/백업/배포 가이드가 실제 동작과 일치한다.
- 브라우저 저장소 초기화·전체 교체 등 파괴적 행위에는 명시적 확인이 있다.

---

## 9. 단계별 Codex 구현 로드맵

### Phase 1 — 기초 프로젝트 + 저장소 + PWA

- [ ] 기존 저장소 조사 후 Vite + React + TypeScript 프로젝트 생성/정리.
- [ ] ESLint, strict TypeScript, Vitest, Testing Library 기본 구성.
- [ ] Dexie DB, `Expense`, 카테고리, Zod 검증, 날짜/금액 유틸 구성.
- [ ] Repository create/read/update/delete 및 DB/도메인 단위 테스트 작성.
- [ ] 기본 `AppShell`, 모바일 하단 탭과 빈 상태 화면 구현.
- [ ] `vite-plugin-pwa` Manifest, 아이콘 및 precache, 사용자 승인 업데이트 UX 기초 구축.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` 실행.

**Phase 1 완료:** 실제 브라우저에서 빈 앱 표시, 로컬 저장소 생성 가능, 지원 환경에서 PWA 정적 파일 생성 및 모든 자동 검증 통과.

### Phase 2 — 지출 등록·수정·삭제

- [ ] 금액/카테고리/날짜/사용처/메모 편집 UI 구현.
- [ ] Create/Update/Delete 및 저장 중 중복 클릭 방지.
- [ ] 삭제 확인, 편집 중 이탈 확인, 오류 메시지 및 재시도.
- [ ] Dexie 데이터 변경 시 내역 자동 갱신.
- [ ] CRUD 자동 테스트 및 저장 후 새로고침 E2E.

**Phase 2 완료:** 금액 입력→카테고리 선택→저장, 새로고침 후 유지, 수정·삭제까지 실제 브라우저에서 성공.

### Phase 3 — 홈, 월별 목록, 소비 캘린더

- [ ] 홈 총지출/전월 비교/최근 5건.
- [ ] 월 선택, 내역 정렬, 월간 소비 달력 및 날짜별 합계.
- [ ] 데이터 없는 달, 12월→1월 전환, 윤년, 월 경계 테스트.
- [ ] 모바일 레이아웃 및 키보드 사용성 개선.

**Phase 3 완료:** 날짜·월 전환 및 CRUD 이후 홈과 캘린더 월별 총액이 일치.

### Phase 4 — 소비 통계 + 백업/복원(출시 차단 기능)

- [ ] 카테고리별 금액·비중·전월 비교, 간결한 CSS 막대그래프.
- [ ] 버전 1 JSON 백업 생성, 파일 다운로드/공유 브라우저 호환 처리.
- [ ] JSON 스키마 검증, 크기·건수 제한, 미리보기, 전체 교체 확인.
- [ ] 단일 트랜잭션 복원 및 롤백·왕복 테스트.
- [ ] 마지막 백업 시각·데이터 보관 위험 안내.

**Phase 4 완료:** 데이터를 내보낸 뒤 삭제된/새로운 DB에 복원할 수 있고, 실패 시 기존 DB가 유지되며 통계가 정확.

### Phase 5 — 모바일 PWA 안정화·무료 정적 배포 준비

- [ ] Android Chrome 및 iOS Safari 홈 화면 설치 안내 UI/README.
- [ ] Service Worker 오프라인/업데이트/SPA fallback 테스트.
- [ ] Playwright 모바일 viewport/E2E 및 가능한 경우 실기기 테스트.
- [ ] 접근성/키보드/safe area/오류 화면 완성.
- [ ] Cloudflare Pages 배포 설정 및 README 절차 작성.
- [ ] 사용자가 명시적으로 승인하면 무료 Pages 계정에 실제 정적 배포.

**Phase 5 완료:** 정적 호스팅 가능한 `dist/` 산출물, 개인 기록 외부 전송 없음, 오프라인 핵심 기능, 백업·복원, 설치 안내의 검증 완료.

---

## 10. 개발/배포 명령과 환경 설정

### 10.1 추천 npm 스크립트

`package.json`에 가능한 한 다음 스크립트를 제공한다. 실제 플러그인/템플릿에 맞춰 세부 명령 수정 가능.

```json
{
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc -b",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test:e2e": "playwright test"
  }
}
```

- 위 스크립트는 **문서상의 목표**이며, 실제 기능을 설치하지 않았는데 명령만 만들어 두지 않는다.
- 패키지는 `npm ci`로 재설치 가능해야 하고 lockfile을 버전 관리한다.
- 개발 환경: 로컬 `npm install`, `npm run dev`, 브라우저 오픈.
- 오프라인 검증: `npm run build`, `npm run preview` 후 브라우저에서 사이트 최초 로드, 네트워크 차단, 새로고침 및 기록 저장.

### 10.2 Cloudflare Pages 정적 배포 설정

사용자 승인 후 아래 값을 사용한다.

```text
Framework preset : React (Vite)
Build command    : npm run build
Build output     : dist
Production branch: main
Domain           : <project>.pages.dev (무료 기본 주소)
Functions/Workers: 사용하지 않음
Database         : 사용하지 않음
```

- 사용자 백업 JSON, `.env`, 로컬 데이터가 빌드 산출물 `dist/`에 포함되지 않게 점검.
- 프로젝트 안에서 외부 비밀키·서버 API URL을 요구하지 않는다.
- 무료 플랜 한도, 버전별 빌드 정책 등은 **배포 당시에 공식 문서 확인**. 무료 기본 기능 범위 밖으로 확장하지 않는다.
- Cloudflare 계정에 로그인하거나 배포를 실제 실행할 때에는 사용자 명시적 지시가 필요하다.

### 10.3 모바일 설치 안내 문구

- **Android:** Chrome으로 배포된 HTTPS 주소 열기 → 브라우저 메뉴의 `앱 설치` 또는 `홈 화면에 추가` 선택(기기/버전별 문구 상이).
- **iPhone:** Safari로 배포된 HTTPS 주소 열기 → 공유 메뉴 → `홈 화면에 추가` → 생성된 아이콘에서 앱 실행.
- 브라우저 앱 탭과 홈 화면에서 실행한 앱 사이에 기록이 자동으로 동기화된다고 설명하지 않는다.
- **권장:** 홈 화면 아이콘으로 계속 사용하며 정기적으로 JSON을 백업하고 별도 위치에 보관한다.

---

## 11. Codex 작업 보고 형식

각 Phase 작업 완료 시 다음 템플릿으로 **실행 증거와 함께** 보고한다.

```text
[현재 Phase]
- Phase 번호 및 목표

[구현]
- 완료된 기능과 핵심 설계 결정
- 변경한 파일 목록 및 역할

[검증]
- 실제 실행한 명령어/브라우저 테스트
- 성공/실패 결과와 주요 로그 요약
- 검증하지 못한 항목(특히 실기기 iOS 홈 화면 설치)

[안전성/비용]
- 데이터 저장/복원 정책 위반 여부
- 외부 데이터 전송/비용이 생기는 변경 여부

[남은 작업]
- 미완료 테스트/버그
- 다음 Phase 우선순위
```

### Codex 최초 실행 프롬프트

다음 지시로 시작한다.

> 저장소 루트의 `AGENTS.md`를 먼저 읽고, React + TypeScript + Vite 기반의 개인 지출 관리 PWA를 개발하라. 지금은 **Phase 1부터 시작**한다. 저장소의 기존 파일이 있으면 사용 가능한 기능을 보존한다. Dexie IndexedDB 모델과 Repository, 금액·날짜 유효성 검증, 기본 모바일 AppShell, Manifest/Service Worker를 구현하라. 타입검사/린트/단위테스트/프로덕션 빌드를 실제 실행해 검증하라. 백엔드/로그인/유료 서비스/Android·iOS 네이티브 앱을 추가하지 말고, 진척과 오류를 문서의 보고 형식에 맞춰 정리하라. 완료 가능한 단계는 순차로 이어가되, 검증되지 않은 내용을 완료했다고 주장하지 마라.

---

## 12. 공식 문서(구현 시 우선 확인)

- [React](https://react.dev/)
- [Vite Guide](https://vite.dev/guide/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [vite-plugin-pwa React](https://vite-pwa-org.netlify.app/frameworks/react.html)
- [Dexie.js](https://dexie.org/)
- [Dexie `useLiveQuery`](https://dexie.org/docs/dexie-react-hooks/useLiveQuery())
- [Dexie Transactions](https://dexie.org/docs/Dexie/Dexie.transaction())
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [web.dev PWA 설치](https://web.dev/learn/pwa/installation/)
- [Cloudflare Pages React 배포](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)

---

**성공 판정:** 휴대폰에서 PWA를 홈 화면에 추가하고, 인터넷이 없는 상태에서도 지출을 3단계로 기록·수정·삭제할 수 있으며, 기록·달력·통계가 일치한다. JSON 백업 후 다른 브라우저 저장소/설치본으로 복원할 수 있고, 기능 이용에 서버 비용이나 앱스토어 등록료가 필요하지 않다.