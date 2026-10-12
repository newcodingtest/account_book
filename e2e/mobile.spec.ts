import { test, expect } from "@playwright/test";
for (const width of [320, 375, 430])
  for (const colorScheme of ["light", "dark"] as const)
    test(
      width + "px " + colorScheme + " 반응형·포커스·외부 요청 없음",
      async ({ page }) => {
        await page.setViewportSize({ width, height: 812 });
        await page.emulateMedia({ colorScheme });
        const foreign: string[] = [];
        page.on("request", (r) => {
          if (
            !r.url().startsWith("http://127.0.0.1:4183/") &&
            !r.url().startsWith("blob:") &&
            !r.url().startsWith("data:")
          )
            foreign.push(r.url());
        });
        await page.goto("/");
        await expect(page.getByText("아직 지출 기록이 없어요")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        for (const tab of ["내역", "통계"]) {
          await page.getByRole("button", { name: tab, exact: true }).click();
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
        }
        await page.getByRole("button", { name: "+ 지출 추가" }).click();
        await expect(page.getByLabel("금액 (원)")).toBeFocused();
        await page.getByLabel("금액 (원)").fill("999999999");
        await page.getByLabel("쇼핑", { exact: true }).check();
        await page.getByLabel("메모").fill("아주 긴 메모 ".repeat(20));
        expect(
          await page
            .getByRole("dialog")
            .evaluate((e) => e.scrollWidth <= e.clientWidth),
        ).toBe(true);
        await page.screenshot({
          path: "test-results/mobile-" + width + "-" + colorScheme + ".png",
          fullPage: true,
        });
        page.once("dialog", (d) => d.dismiss());
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toBeVisible();
        page.once("dialog", (d) => d.accept());
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "설정 및 백업" }).click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: "test-results/settings-" + width + "-" + colorScheme + ".png",
          fullPage: true,
        });
        expect(foreign).toEqual([]);
      },
    );
test("IndexedDB 접근 불가는 빈 기록 대신 오류", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(IDBFactory.prototype, "open", {
      value: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "기록을 읽거나 계산하지 못했어요",
  );
  await expect(page.getByText("아직 지출 기록이 없어요")).toHaveCount(0);
});
test("저장용량 오류에서 입력값 보존", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ 지출 추가" }).click();
  await page.getByLabel("금액 (원)").fill("100");
  await page.getByLabel("생활", { exact: true }).check();
  await page.evaluate(() => {
    Object.defineProperty(IDBObjectStore.prototype, "add", {
      value: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    });
  });
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("저장하지 못했어요");
  await expect(page.getByLabel("금액 (원)")).toHaveValue("100");
});
