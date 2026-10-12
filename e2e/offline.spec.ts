import { test, expect } from "@playwright/test";
test("프로덕션 오프라인 새로고침·탭·CRUD·자산만 캐시", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "나의 지출" })).toBeVisible();
  await page.getByRole("button", { name: "+ 지출 추가" }).click();
  await page.getByLabel("금액 (원)").fill("1550");
  await page.getByLabel("교통", { exact: true }).check();
  await page.getByLabel("사용처").fill("오프라인 버스");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("1,550원");
  await page.getByRole("button", { name: "내역", exact: true }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("1,550원");
  await page.getByRole("button", { name: "통계", exact: true }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("1,550원");
  await page.reload();
  await page.getByRole("button", { name: /오프라인 버스/ }).click();
  await page.getByLabel("금액 (원)").fill("2000");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("2,000원");
  await page.getByRole("button", { name: /오프라인 버스/ }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "지출 삭제" }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("0원");
  const urls = await page.evaluate(async () => {
    const keys = await caches.keys();
    return (
      await Promise.all(
        keys.map(async (k) =>
          (await (await caches.open(k)).keys()).map((r) => r.url),
        ),
      )
    ).flat();
  });
  expect(urls.length).toBeGreaterThan(0);
  expect(
    urls.every((url) => !url.includes("backup") && !url.includes("expenses")),
  ).toBe(true);
});
