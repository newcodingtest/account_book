// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useAppInstall } from "../src/shared/utils/useAppInstall";

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function promptEvent(outcome: "accepted" | "dismissed") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn().mockResolvedValue(undefined);
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
  return { event, prompt };
}

test("captures the prompt before the guide opens and consumes it once", async () => {
  const { result } = renderHook(useAppInstall);
  const { event, prompt } = promptEvent("accepted");
  act(() => { window.dispatchEvent(event); });
  expect(event.defaultPrevented).toBe(true);
  expect(result.current.available).toBe(true);
  await act(async () => { await result.current.install(); });
  expect(prompt).toHaveBeenCalledTimes(1);
  expect(result.current.available).toBe(false);
  expect(result.current.installed).toBe(false);
  await act(async () => { await result.current.install(); });
  expect(prompt).toHaveBeenCalledTimes(1);
  act(() => { window.dispatchEvent(new Event("appinstalled")); });
  expect(result.current.installed).toBe(true);
});

test("dismissal leaves the app uninstalled and allows a fresh prompt", async () => {
  const { result } = renderHook(useAppInstall);
  const { event } = promptEvent("dismissed");
  act(() => { window.dispatchEvent(event); });
  await act(async () => { await result.current.install(); });
  expect(result.current.installed).toBe(false);
  expect(result.current.message).toContain("취소");
  act(() => { window.dispatchEvent(promptEvent("accepted").event); });
  expect(result.current.available).toBe(true);
});

test("a failed prompt releases the busy state and provides manual instructions", async () => {
  const { result } = renderHook(useAppInstall);
  const { event, prompt } = promptEvent("accepted");
  prompt.mockRejectedValue(new Error("Unavailable"));
  act(() => { window.dispatchEvent(event); });
  await act(async () => { await result.current.install(); });
  expect(result.current.busy).toBe(false);
  expect(result.current.message).toContain("브라우저 메뉴");
});
