import { test, expect } from "@playwright/test";
test("월/달력 합계와 12월-1월 경계", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-12-31T03:00:00Z"));
  await page.goto("/");
  for (const [amount, date, merchant] of [
    ["12000", "2026-12-31", "연말"],
    ["5500", "2027-01-01", "새해"],
  ]) {
    await page.getByRole("button", { name: "+ 지출 추가" }).click();
    await page.getByLabel("금액 (원)").fill(amount);
    await page.getByLabel("식비", { exact: true }).check();
    await page.getByLabel("날짜", { exact: true }).fill(date);
    await page.getByLabel("사용처").fill(merchant);
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expect(page.getByTestId("monthly-total")).toHaveText("12,000원");
  await page.getByRole("button", { name: "내역", exact: true }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("12,000원");
  await page.getByRole("button", { name: "2026-12-31 지출 12,000원" }).click();
  await expect(page.getByRole("button", { name: /연말/ })).toBeVisible();
  await page.getByRole("button", { name: "다음 달" }).click();
  await expect(page.getByRole("heading", { name: "2027년 1월" })).toBeVisible();
  await expect(page.getByTestId("monthly-total")).toHaveText("5,500원");
  await expect(page.getByRole("button", { name: /새해/ })).toBeVisible();
  await page.getByRole("button", { name: "이전 달" }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("12,000원");
});
