# 휴대폰 설치를 위한 정적 배포

현재 PC의 localhost/127.0.0.1 주소는 휴대폰에서 PC 앱을 여는 주소가 아닙니다. 홈 화면 설치와 서비스 워커 사용을 위해 같은 앱을 HTTPS 주소에서 제공해야 합니다. 개인 지출은 업로드되지 않으며 앱 정적 파일만 배포합니다. 실제 배포는 사용자의 별도 승인 후 진행합니다.

## 수동 업로드

1. 프로젝트 폴더에서 아래 명령을 실행합니다.

```powershell
Set-Location "D:\backup\vsCodeworkspace\side\account\docs"
npm run build
```

2. 본인의 Cloudflare 계정에서 Workers & Pages → Create application → Get started → Drag and drop your files로 Pages 프로젝트를 만듭니다. 메뉴 표기는 바뀔 수 있으니 [공식 Direct Upload 문서](https://developers.cloudflare.com/pages/get-started/direct-upload/)도 확인하세요.
3. 생성된 dist 폴더를 올리고 배포합니다. index.html이 배포 루트에 있어야 합니다. 소스 전체·node_modules·개인 백업·.env는 올리지 않습니다.
4. 제공된 https://프로젝트명.pages.dev 주소를 휴대폰에서 엽니다. 앱 안의 ? 버튼이나 해당 주소의 /#guide를 공유하면 설치·사용 안내를 볼 수 있습니다.

기본 Pages 주소를 이용하고 Functions/Workers 실행 코드·DB·R2·유료 도메인·분석 도구는 추가하지 않습니다. 별도 결제 없는 무료 플랜 범위를 사용하며 배포 당시 조건을 확인하세요. Direct Upload 프로젝트는 이후 Git 자동 배포로 직접 전환할 수 없으므로 자동 배포가 필요하면 처음부터 Git 연결 방식을 선택해야 합니다.

## Git 연결 배포를 선택하는 경우

프로젝트를 저장소에 커밋하고 Cloudflare Pages에서 연결합니다. 프로젝트가 저장소의 docs 폴더에 있으면 Root directory를 docs로 지정합니다. package.json·package-lock.json이 있는 폴더가 빌드 루트입니다. Build command: npm run build, Output directory: dist, Node: 24 LTS를 설정합니다. 개인 백업은 커밋하지 않습니다. [공식 React 배포 안내](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)

## 휴대폰 홈 화면 추가

- Android: Chrome에서 HTTPS 앱 주소 → ⋮ 메뉴 → 설치 및 바로가기 만들기 → 설치. 버전에 따라 앱 설치/홈 화면에 추가로 표시됩니다. [Google 공식 안내](https://support.google.com/chrome/answer/9658361?hl=ko&co=GENIE.Platform%3DAndroid)
- iPhone: Safari에서 HTTPS 앱 주소 → 공유 메뉴 → 홈 화면에 추가. 웹 앱으로 열기 항목이 보이면 켭니다. 추가 후 같은 아이콘으로 실행합니다. [Apple 공식 안내](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios)

PC/다른 주소/Safari 탭의 기존 기록은 자동 이동하지 않습니다. 사용하던 환경에서 JSON 백업을 내보내 휴대폰 또는 홈 화면 앱에서 복원하세요. 복원은 현재 기록 전체를 교체하므로 대상 기기의 기존 기록도 먼저 백업하세요. 이후 배포를 업데이트할 때도 같은 기본 주소를 유지하세요.

설치 후 인터넷 연결 상태에서 앱 자산 저장을 마치고 비행기 모드로 조회·등록·수정·삭제를 확인하세요. 실제 Android/iPhone 설치·재실행·백업 다운로드/복원은 아직 실기기 검증 대기이며 자동 브라우저 테스트가 이를 대체하지 않습니다.
