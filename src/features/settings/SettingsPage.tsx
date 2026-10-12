import { StorageNotice } from "../../shared/components/StorageNotice";
import { useEffect, useRef, useState } from "react";
import { repository } from "../../data/expenseRepository";
import {
  exportBackup,
  previewBackup,
  readBackup,
  restoreBackup,
} from "./backup";
import type { Backup } from "./backupSchema";
import { downloadJson } from "../../shared/utils/download";
import { localDate } from "../../shared/utils/dates";
import { money } from "../../shared/utils/money";
function lastBackup() {
  try {
    return localStorage.getItem("last-backup-at");
  } catch {
    return null;
  }
}
export function SettingsPage({
  onBusy,
  onGuide,
}: {
  onBusy: (busy: boolean) => void;
  onGuide: () => void;
}) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    onBusy(busy);
    return () => onBusy(false);
  }, [busy, onBusy]);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [last, setLast] = useState(lastBackup);
  const [pending, setPending] = useState<{
    backup: Backup;
    current: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  async function perform(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "작업에 실패했어요. 저장소 접근과 용량을 확인하세요.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function download(share = false) {
    await perform(async () => {
      const text = await exportBackup();
      const name = "pocket-expense-backup-" + localDate() + ".json";
      if (share) {
        const file = new File([text], name, { type: "application/json" });
        if (navigator.canShare?.({ files: [file] }))
          await navigator.share({ files: [file], title: "나의 지출 백업" });
        else
          throw new Error(
            "이 브라우저는 파일 공유를 지원하지 않아요. 내보내기를 이용하세요.",
          );
      } else downloadJson(text, name);
      const now = new Date().toISOString();
      try {
        localStorage.setItem("last-backup-at", now);
      } catch {
        /* 백업 파일 생성과 설정 저장은 독립적입니다. */
      }
      setLast(now);
      setMessage(
        "백업 파일을 만들었어요. 다운로드/공유한 파일이 안전하게 저장됐는지 확인하세요.",
      );
    });
  }
  async function select(file: File) {
    setPending(null);
    await perform(async () => {
      const backup = await readBackup(file);
      const current = await repository.count();
      setPending({ backup, current });
    });
  }
  async function restore() {
    if (
      !pending ||
      !window.confirm(
        "복원하면 현재 지출 기록이 교체됩니다. 기존 데이터를 먼저 백업했나요?",
      )
    )
      return;
    await perform(async () => {
      try {
        const result = await restoreBackup(pending.backup);
        setPending(null);
        setMessage(
          "복원 완료: " + result.count + "건 · " + money(result.total),
        );
      } catch {
        throw new Error(
          "복원에 실패했어요. 저장소 접근과 용량을 확인한 뒤 다시 시도하세요.",
        );
      }
    });
  }
  const summary = pending ? previewBackup(pending.backup) : null;
  return (
    <>
      <section>
        <h2>설치와 사용 안내</h2>
        <p>
          휴대폰 홈 화면에 추가하는 방법, 지출 기록과 백업 방법을 확인하세요.
        </p>
        <button className="full" disabled={busy} onClick={onGuide}>
          설치·사용 안내 보기
        </button>
      </section>
      <section>
        <h2>기록 보관과 백업</h2>
        <StorageNotice />
        <p>
          기록은 이 기기의 브라우저에 저장됩니다. 기기 변경·브라우저 데이터 삭제
          시 사라질 수 있으므로 백업 파일을 안전하게 보관하세요.
        </p>
        <p className="muted">
          서버·로그인·자동 동기화가 없어요. iPhone의 Safari 탭과 홈 화면 앱은
          저장소가 별개일 수 있어요. 같은 홈 화면 아이콘으로 계속 사용하고, 다른
          기기나 설치본에서는 JSON을 수동 복원하세요.
        </p>
        <p className="muted">
          백업은 금융 관련 개인 기록을 포함한 평문 JSON 파일입니다. 직접 안전한
          위치에 보관하세요.
        </p>
        <button
          disabled={busy}
          className="primary full"
          onClick={() => void download()}
        >
          JSON 백업 내보내기
        </button>
        {typeof navigator.share === "function" && (
          <button
            disabled={busy}
            className="full"
            onClick={() => void download(true)}
          >
            백업 파일 공유
          </button>
        )}
        <p className="muted">
          마지막 백업 파일 생성:{" "}
          {last ? new Date(last).toLocaleString("ko-KR") : "아직 없음"}
        </p>
        <button
          disabled={busy}
          className="full"
          onClick={() => inputRef.current?.click()}
        >
          JSON 백업에서 복원
        </button>
        <input
          className="visually-hidden"
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          aria-label="백업 파일 선택"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void select(file);
          }}
        />
        {busy && <p role="status">처리 중…</p>}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
      </section>
      {pending && summary && (
        <section aria-label="복원 미리보기">
          <h2>복원 미리보기</h2>
          <p>
            {summary.count}건 · {money(summary.total)}
          </p>
          <p>
            기간:{" "}
            {summary.start ? summary.start + " ~ " + summary.end : "기록 없음"}
          </p>
          <p>현재 로컬 기록: {pending.current}건</p>
          <p className="error">
            기존 데이터 전체를 교체합니다. 먼저 현재 기록을 백업하세요.
          </p>
          <button
            className="danger full"
            disabled={busy}
            onClick={() => void restore()}
          >
            전체 교체 복원
          </button>
          <button
            className="full"
            disabled={busy}
            onClick={() => setPending(null)}
          >
            복원 취소
          </button>
        </section>
      )}
      <section>
        <h2>설치 안내</h2>
        <h3>Android · Chrome</h3>
        <p>
          HTTPS 주소를 Chrome에서 열고 메뉴의 ‘앱 설치’ 또는 ‘홈 화면에 추가’를
          선택하세요.
        </p>
        <h3>iPhone · Safari</h3>
        <p>
          HTTPS 주소를 Safari에서 열고 공유 메뉴 → ‘홈 화면에 추가’를
          선택하세요. 생성된 아이콘으로 실행하세요.
        </p>
        <p className="muted">
          최초 로드와 업데이트는 인터넷이 필요합니다. 앱 자산이 저장된 후에는
          오프라인으로 기록할 수 있어요. 지속 저장을 허용해도 수동 백업은
          필요합니다.
        </p>
        <button
          className="full"
          disabled={busy}
          onClick={() =>
            void perform(async () => {
              const granted = await navigator.storage?.persist?.();
              setMessage(
                granted
                  ? "지속 저장이 허용됐어요. 정기적인 수동 백업도 필요합니다."
                  : "지속 저장이 거절됐거나 지원되지 않아요. 수동 백업을 보관하세요.",
              );
            })
          }
        >
          브라우저 지속 저장 요청
        </button>
      </section>
    </>
  );
}
