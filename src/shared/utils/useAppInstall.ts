import { useEffect, useRef, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useAppInstall() {
  const pending = useRef<InstallPromptEvent | null>(null);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [installed, setInstalled] = useState(() =>
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const ready = (event: Event) => {
      event.preventDefault();
      pending.current = event as InstallPromptEvent;
      setAvailable(true);
      setMessage("");
    };
    const complete = () => {
      pending.current = null;
      setAvailable(false);
      setInstalled(true);
      setMessage("");
    };
    const modeChanged = () => {
      if (display.matches) complete();
    };
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", complete);
    display.addEventListener("change", modeChanged);
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", complete);
      display.removeEventListener("change", modeChanged);
    };
  }, []);

  const install = async () => {
    const event = pending.current;
    if (!event || busy) return;
    pending.current = null;
    setAvailable(false);
    setBusy(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      setMessage(choice.outcome === "accepted"
        ? "추가 요청을 완료했어요. 설치가 끝나면 홈 화면 아이콘으로 실행하세요."
        : "설치를 취소했어요. 브라우저 메뉴에서 나중에 추가할 수 있어요.");
    } catch {
      setMessage("설치창을 열지 못했어요. 아래 브라우저 메뉴 안내로 추가하세요.");
    } finally {
      setBusy(false);
    }
  };

  return { available, busy, installed, message, install };
}
