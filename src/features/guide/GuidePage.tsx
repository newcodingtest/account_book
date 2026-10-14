import { StorageNotice } from "../../shared/components/StorageNotice";
import { useState } from "react";
import type { useAppInstall } from "../../shared/utils/useAppInstall";

const instructions = {
  android: [
    "Chrome에서 공유받은 HTTPS 앱 주소를 여세요.",
    "오른쪽 위 ⋮ 메뉴에서 설치 및 바로가기 만들기 → 설치를 선택하세요. 기기에 따라 앱 설치 또는 홈 화면에 추가로 표시됩니다.",
    "설치를 마치고 홈 화면의 나의 지출 아이콘을 누르세요.",
  ],
  iphone: [
    "Safari에서 공유받은 HTTPS 앱 주소를 여세요.",
    "공유 메뉴를 열고 홈 화면에 추가를 선택하세요. 안 보이면 목록 아래 동작 편집에서 추가하세요.",
    "웹 앱으로 열기 항목이 보이면 켜고 추가를 누르세요. 홈 화면의 나의 지출 아이콘으로 실행하세요.",
  ],
};

export function GuidePage({
  installation,
  offlineReady,
  onStart,
  onBackup,
}: {
  installation: ReturnType<typeof useAppInstall>;
  offlineReady: boolean;
  onStart: () => void;
  onBackup: () => void;
}) {
  const [device, setDevice] = useState<"android" | "iphone">(() =>
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      ? "iphone" : "android",
  );
  const { installed, available, busy, message, install } = installation;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  return (
    <div className="guide-page">
      <section className="guide-hero">
        <img src="/favicon.svg" alt="" width="56" height="56" />
        <p className="eyebrow">나의 지출 사용 안내</p>
        <h2>
          내 지출을 기록하는
          <br />
          가장 가벼운 습관
        </h2>
        <p>
          금액을 입력하고, 카테고리를 고르고, 저장하세요. 나의 지출은 휴대폰 홈
          화면에서 앱처럼 쓰는 개인 지출 가계부입니다.
        </p>
        <div className="guide-tags">
          <span>가입 없이</span>
          <span>오프라인 기록</span>
          <span>내 기기에 보관</span>
        </div>
        <button className="primary full" onClick={onStart}>
          지출 기록 시작
        </button>
      </section>
      <section aria-labelledby="install-heading">
        <p className="eyebrow">01 · 홈 화면에 설치</p>
        <h2 id="install-heading">내 휴대폰에 추가하기</h2>
        {installed ? (
          <p className="notice">현재 홈 화면 앱으로 실행 중이에요.</p>
        ) : (
          <p>설치 후에는 홈 화면의 같은 아이콘으로 계속 사용하세요.</p>
        )}
        {!installed && (available || busy) && (
          <button
            className="primary full"
            disabled={busy}
            onClick={() => void install()}
          >
            {busy ? "설치 확인 중…" : "내 휴대폰에 추가하기"}
          </button>
        )}
        {!installed && message && (
          <p className="notice" role="status">{message}</p>
        )}
        {local && (
          <p className="notice">
            지금 주소는 현재 기기에서만 열리는 테스트 주소예요. 휴대폰에서는
            공유받은 HTTPS 앱 주소로 접속하세요.
          </p>
        )}
        <div className="guide-device" role="group" aria-label="휴대폰 선택">
          <button
            aria-pressed={device === "android"}
            onClick={() => setDevice("android")}
          >
            Android · Chrome
          </button>
          <button
            aria-pressed={device === "iphone"}
            onClick={() => setDevice("iphone")}
          >
            iPhone · Safari
          </button>
        </div>
        <ol className="guide-steps">
          {instructions[device].map((text, index) => (
            <li key={device + index}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <p className="muted">
          카카오톡 등의 앱 안에서 열었다면 Chrome 또는 Safari로 다시 여세요.
          메뉴 이름은 기기·브라우저 버전에 따라 다를 수 있어요.
        </p>
      </section>
      <section aria-labelledby="usage-heading">
        <p className="eyebrow">02 · 매일의 기록</p>
        <h2 id="usage-heading">기록은 세 단계면 충분해요</h2>
        <ol className="guide-steps">
          <li>
            <span aria-hidden="true">1</span>
            <p>
              <strong>금액 입력</strong>
              <br />+ 지출 추가를 누르고 원 단위 금액을 입력하세요.
            </p>
          </li>
          <li>
            <span aria-hidden="true">2</span>
            <p>
              <strong>카테고리 선택</strong>
              <br />
              식비·카페·교통 등 사용한 곳을 고르세요. 날짜·사용처·메모도 바꿀 수
              있어요.
            </p>
          </li>
          <li>
            <span aria-hidden="true">3</span>
            <p>
              <strong>저장</strong>
              <br />
              홈에서 합계, 내역에서 날짜별 기록, 통계에서 카테고리별 소비를
              확인하세요. 기록을 누르면 수정하거나 삭제할 수 있어요.
            </p>
          </li>
        </ol>
        <p className="notice">
          {offlineReady
            ? "이 실행 환경은 오프라인 사용 준비가 됐어요."
            : "처음에는 인터넷에 연결해 앱을 열고 오프라인 사용 준비가 끝날 때까지 기다려 주세요."}{" "}
          이후 비행기 모드에서도 기록을 확인하고 추가·수정·삭제할 수 있어요. 새
          버전은 인터넷 연결 후 직접 업데이트를 선택하세요.
        </p>
      </section>
      <section aria-labelledby="backup-heading">
        <p className="eyebrow">03 · 내 기록 지키기</p>
        <h2 id="backup-heading">백업 파일도 함께 보관하세요</h2>
        <StorageNotice />
        <p>
          기록은 이 기기의 브라우저에만 저장됩니다. 기기 변경·브라우저 데이터
          삭제·저장소 정리로 사라질 수 있어요.
        </p>
        <ol className="guide-steps">
          <li>
            <span aria-hidden="true">1</span>
            <p>설정 및 백업 → JSON 백업 내보내기에서 파일을 만드세요.</p>
          </li>
          <li>
            <span aria-hidden="true">2</span>
            <p>
              파일이 저장됐는지 확인하고 별도의 안전한 위치에 보관하세요. 백업은
              개인 지출이 담긴 평문 파일이에요.
            </p>
          </li>
          <li>
            <span aria-hidden="true">3</span>
            <p>
              다른 기기에서는 파일을 직접 옮겨 JSON 백업에서 복원을 선택하세요.
              미리보기 후 확인하면 기존 기록과 병합됩니다. 같은 ID는 최신 수정
              기록을 사용하고, 수정 시각이 같으면 현재 기록을 유지합니다.
            </p>
          </li>
        </ol>
        <p className="notice">
          iPhone의 Safari 탭과 홈 화면 앱은 저장소가 별개일 수 있어요. 설치 전에
          입력한 기록이 있다면 먼저 백업하고, 홈 화면 앱에서 수동 복원하세요.
          다른 기기와 자동 동기화하지 않습니다.
        </p>
        <button className="full" onClick={onBackup}>
          설정 및 백업 열기
        </button>
      </section>
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">궁금한 점</h2>
        <details>
          <summary>설치 메뉴가 보이지 않아요</summary>
          <p>
            앱 안의 브라우저를 닫고 Android는 Chrome, iPhone은 Safari에서 HTTPS
            앱 주소를 직접 여세요. iPhone은 공유 메뉴의 동작 편집도 확인하세요.
          </p>
        </details>
        <details>
          <summary>인터넷이 없어도 사용할 수 있나요?</summary>
          <p>
            최초 접속과 앱 자산 저장은 인터넷이 필요해요. 준비가 끝나면 같은
            아이콘으로 오프라인에서 사용할 수 있습니다. 브라우저 저장소를
            삭제하면 앱과 기록을 다시 준비해야 할 수 있어요.
          </p>
        </details>
        <details>
          <summary>기록이 다른 휴대폰에도 보이나요?</summary>
          <p>
            각 기기·브라우저·설치본의 기록은 따로 보관됩니다. JSON 백업 파일을
            직접 이동하고 복원하세요. 공개된 앱 주소를 다른 사람이 열어도 내
            기기의 기록은 함께 전달되지 않습니다.
          </p>
        </details>
        <details>
          <summary>회원가입이나 별도 이용료가 있나요?</summary>
          <p>
            회원가입과 로그인 없이 사용합니다. 앱에 결제·구독 기능은 없고,
            지출을 저장하는 서버도 없습니다.
          </p>
        </details>
      </section>
    </div>
  );
}
