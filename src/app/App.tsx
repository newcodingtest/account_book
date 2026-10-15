import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRegisterSW } from "virtual:pwa-register/react";
import { repository } from "../data/expenseRepository";
import type { Expense } from "../domain/expense";
import { ExpenseEditor } from "../features/expense/ExpenseEditor";
import { HomePage } from "../features/home/HomePage";
import { HistoryPage } from "../features/history/HistoryPage";
import { StatisticsPage } from "../features/statistics/StatisticsPage";
import { aggregate } from "../features/statistics/statistics";
import { SettingsPage } from "../features/settings/SettingsPage";
import { MonthSelector } from "../shared/components/MonthSelector";
import { localDate, shiftMonth } from "../shared/utils/dates";
import { GuidePage } from "../features/guide/GuidePage";
import { useAppInstall } from "../shared/utils/useAppInstall";
export default function App() {
  const installation = useAppInstall();
  const [tab, setTab] = useState(location.hash === "#guide" ? "안내" : "홈");
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [editor, setEditor] = useState<{ expense: Expense | null } | null>(
    null,
  );
  const [dirty, setDirty] = useState(false);
  const [editorBusy, setEditorBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [systemMessage, setSystemMessage] = useState("");
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(
    undefined,
  );
  const busy = editorBusy || settingsBusy;
  const navigate = (next: string) => {
    setTab(next);
    history.replaceState(
      history.state,
      "",
      location.pathname + location.search + (next === "안내" ? "#guide" : ""),
    );
    window.scrollTo(0, 0);
  };
  const onDirty = useCallback((value: boolean) => setDirty(value), []);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registrationRef.current = registration;
    },
    onRegisterError() {
      setSystemMessage(
        "오프라인 준비를 완료하지 못했어요. 인터넷 연결과 브라우저 지원을 확인하세요.",
      );
    },
  });
  useEffect(() => {
    const status = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine)
        void registrationRef.current
          ?.update()
          .catch(() =>
            setSystemMessage(
              "업데이트를 확인하지 못했어요. 인터넷 연결 후 다시 시도하세요.",
            ),
          );
    };
    window.addEventListener("online", status);
    window.addEventListener("offline", status);
    return () => {
      window.removeEventListener("online", status);
      window.removeEventListener("offline", status);
    };
  }, []);
  const data = useLiveQuery(async () => {
    try {
      const rows = await repository.month(month);
      const previous =
        month === "0001-01"
          ? []
          : await repository.month(shiftMonth(month, -1));
      aggregate(rows);
      aggregate(previous);
      return { rows, previous, error: false };
    } catch {
      return { rows: [], previous: [], error: true };
    }
  }, [month]);
  const close = useCallback(() => {
    setEditor(null);
    setDirty(false);
    if (history.state?.expenseEditor) history.back();
  }, []);
  useEffect(() => {
    if (!editor) return;
    const back = () => {
      if (editorBusy) {
        history.pushState({ expenseEditor: true }, "");
        return;
      }
      if (!dirty || window.confirm("저장하지 않은 변경을 버릴까요?")) close();
      else history.pushState({ expenseEditor: true }, "");
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [editor, dirty, editorBusy, close]);
  const open = (expense: Expense | null) => {
    history.pushState({ expenseEditor: true }, "");
    setEditor({ expense });
  };
  const update = () => {
    if (busy) return;
    if (dirty && !window.confirm("저장하지 않은 변경을 버리고 업데이트할까요?"))
      return;
    void updateServiceWorker(true).catch(() =>
      setSystemMessage(
        "업데이트에 실패했어요. 인터넷 연결 후 다시 시도하세요.",
      ),
    );
  };
  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">POCKET EXPENSE</p>
          <h1>나의 지출</h1>
          <small className="connection" role="status">
            {!online
              ? "오프라인 · 이 기기에 저장"
              : offlineReady
                ? "오프라인 사용 준비됨"
                : "기록은 이 기기에만 저장"}
          </small>
        </div>
        <div className="header-actions">
          <button
            disabled={busy}
            className="install-guide-link"
            aria-label="홈 화면 추가"
            onClick={() => navigate("안내")}
          >
            홈 화면 추가
          </button>
          <button
            disabled={busy}
            onClick={() => navigate(tab === "설정" ? "홈" : "설정")}
            aria-label="설정 및 백업"
          >
            ⚙
          </button>
        </div>
      </header>
      {systemMessage && (
        <p className="error" role="alert">
          {systemMessage}
        </p>
      )}
      {needRefresh && !editor && (
        <aside className="notice">
          새 버전이 준비됐어요.
          <button disabled={busy} onClick={update}>
            업데이트
          </button>
        </aside>
      )}
      {tab === "안내" ? (
        <GuidePage
          installation={installation}
          offlineReady={
            offlineReady || Boolean(navigator.serviceWorker?.controller)
          }
          onStart={() => navigate("홈")}
          onBackup={() => navigate("설정")}
        />
      ) : tab === "설정" ? (
        <SettingsPage
          onBusy={setSettingsBusy}
          onGuide={() => navigate("안내")}
        />
      ) : (
        <>
          {tab === "홈" && !installation.installed && (
            <section className="home-install" aria-labelledby="home-install-title">
              <img src="/icons/icon-192.png" alt="" width="52" height="52" />
              <div className="home-install-content">
                <p className="home-install-label">더 편하게 쓰는 방법</p>
                <h2 id="home-install-title">꼭 홈 화면에 추가해 주세요</h2>
                <p>
                  매번 주소를 찾을 필요 없이, 아이콘 한 번으로 바로 열어요.
                  홈 화면에서 앱처럼 편하게 지출을 기록하세요.
                </p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => navigate("안내")}
                >
                  홈 화면 추가하기 <span aria-hidden="true">→</span>
                </button>
                <small>Android·iPhone 추가 방법을 안내해 드려요.</small>
              </div>
            </section>
          )}
          <MonthSelector month={month} onChange={setMonth} />
          {!data ? (
            <p role="status">기록을 불러오는 중…</p>
          ) : data.error ? (
            <section>
              <p role="alert" className="error">
                기록을 읽거나 계산하지 못했어요. 저장소 접근·용량·데이터
                유효성을 확인하세요.
              </p>
              <button onClick={() => location.reload()}>다시 불러오기</button>
            </section>
          ) : tab === "내역" ? (
            <HistoryPage
              key={month}
              month={month}
              rows={data.rows}
              onEdit={open}
            />
          ) : tab === "통계" ? (
            <StatisticsPage rows={data.rows} previous={data.previous} />
          ) : (
            <HomePage rows={data.rows} previous={data.previous} onEdit={open} />
          )}
        </>
      )}
      {tab !== "설정" && tab !== "안내" && (
        <button
          disabled={busy || !data || data.error}
          className="add primary"
          onClick={() => open(null)}
        >
          + 지출 추가
        </button>
      )}
      <nav aria-label="주요 화면">
        {["홈", "내역", "통계"].map((t) => (
          <button
            disabled={busy}
            key={t}
            aria-current={tab === t ? "page" : undefined}
            onClick={() => navigate(t)}
          >
            {t}
          </button>
        ))}
      </nav>
      {editor && (
        <ExpenseEditor
          expense={editor.expense}
          onClose={close}
          onDirty={onDirty}
          onBusy={setEditorBusy}
          update={{ needed: needRefresh, apply: update }}
        />
      )}
    </main>
  );
}
