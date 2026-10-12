import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("다운로드 백업·미리보기 취소·전체 교체 복원·통계", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ 지출 추가" }).click();
  await page.getByLabel("금액 (원)").fill("12000");
  await page.getByLabel("식비", { exact: true }).check();
  await page.getByLabel("사용처").fill("원본");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.getByRole("button", { name: "설정 및 백업" }).click();
  await expect(
    page.getByText(/Safari 탭과 홈 화면 앱은 저장소가 별개/),
  ).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "JSON 백업 내보내기", exact: true })
    .click();
  const download = await downloading;
  const text = await readFile((await download.path())!, "utf8");
  const value = JSON.parse(text);
  expect(value.schemaVersion).toBe(1);
  expect(value.expenses).toHaveLength(1);
  value.expenses[0].merchant = "복원본";
  value.expenses[0].amount = 5500;
  const file = {
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(value)),
  };
  await page.getByLabel("백업 파일 선택").setInputFiles(file);
  await expect(
    page.getByRole("region", { name: "복원 미리보기" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "복원 취소", exact: true }).click();
  await page.getByRole("button", { name: "홈", exact: true }).click();
  await expect(page.getByRole("button", { name: /^원본 / })).toBeVisible();
  await page.getByRole("button", { name: "설정 및 백업" }).click();
  await page.getByLabel("백업 파일 선택").setInputFiles(file);
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "전체 교체 복원" }).click();
  await expect(
    page.getByRole("region", { name: "복원 미리보기" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "전체 교체 복원" }).click();
  await expect(page.getByText("복원 완료: 1건 · 5,500원")).toBeVisible();
  await page.getByRole("button", { name: "홈", exact: true }).click();
  await expect(page.getByRole("button", { name: /복원본/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^원본 / })).toHaveCount(0);
  await page.getByRole("button", { name: "통계", exact: true }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("5,500원");
  await page.getByRole("button", { name: "설정 및 백업" }).click();
  await page
    .getByLabel("백업 파일 선택")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
  await expect(page.getByRole("alert")).toBeVisible();
});
