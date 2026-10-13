import { test, expect } from "@playwright/test";
for (const colorScheme of ["light", "dark"] as const)
  test(
    "안내 직접 접근·기기 선택·오프라인·백업 이동 " + colorScheme,
    async ({ page, context }) => {
      await page.setViewportSize({ width: 320, height: 812 });
      await page.emulateMedia({ colorScheme });
      await page.goto("/#guide");
      await expect(
        page.getByRole("heading", { name: "내 휴대폰에 추가하기" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "iPhone · Safari", exact: true })
        .click();
      await expect(
        page.getByText(/웹 앱으로 열기 항목이 보이면/),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(
        page.getByRole("button", { name: "+ 지출 추가" }),
      ).toHaveCount(0);
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await page.reload();
      await context.setOffline(true);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "내 휴대폰에 추가하기" }),
      ).toBeVisible();
      await expect(
        page.getByText(/설치 전에 입력한 기록이 있다면 먼저 백업/),
      ).toBeVisible();
      await page.screenshot({
        path: "test-results/guide-320-" + colorScheme + ".png",
        fullPage: true,
      });
      await page.getByRole("button", { name: "설정 및 백업 열기" }).click();
      await expect(
        page.getByRole("button", { name: "JSON 백업 내보내기", exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "설치·사용 안내 보기" }).click();
      await expect(page).toHaveURL(/#guide$/);
      await page.getByRole("button", { name: "지출 기록 시작" }).click();
      await expect(page.getByText("아직 지출 기록이 없어요")).toBeVisible();
      await expect(page).not.toHaveURL(/#guide$/);
      await page
        .getByRole("button", { name: "홈 화면 추가", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "내 휴대폰에 추가하기",
        }),
      ).toBeVisible();
    },
  );
