import { test, expect } from "@playwright/test";
test("직접 추가한 카테고리 저장, 수정과 재사용", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ 지출 추가" }).click();
  await page.getByLabel("금액 (원)").fill("30000");
  await page.getByRole("button", { name: "+ 카테고리 직접 추가" }).click();
  await page.getByRole("button", { name: "카테고리 추가", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("1~20자");
  await page.getByLabel("새 카테고리 이름").fill("운동");
  await page.getByRole("button", { name: "카테고리 추가", exact: true }).click();
  await expect(page.getByLabel("운동", { exact: true })).toBeChecked();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /운동.*30,000/ }).click();
  await expect(page.getByLabel("운동", { exact: true })).toBeChecked();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByRole("button", { name: "+ 지출 추가" }).click();
  await expect(page.getByLabel("운동", { exact: true })).toBeVisible();
});
test("지출 CRUD와 새로고침 영속성", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ 지출 추가" }).click();
  await page.getByLabel("금액 (원)").fill("12000");
  await page.getByLabel("식비", { exact: true }).check();
  await page.getByLabel("사용처").fill("테스트 식당");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("button", { name: /테스트 식당/ })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /테스트 식당/ }).click();
  await page.getByLabel("금액 (원)").fill("5500");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("button", { name: /테스트 식당/ })).toContainText(
    "5,500원",
  );
  await page.getByRole("button", { name: /테스트 식당/ }).click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "지출 삭제" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "지출 삭제" }).click();
  await expect(page.getByText("아직 지출 기록이 없어요")).toBeVisible();
});
test("미저장 편집 이탈 취소", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ 지출 추가" }).click();
  await page.getByLabel("금액 (원)").fill("100");
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await expect(page.getByLabel("금액 (원)")).toHaveValue("100");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("브라우저 뒤로가기에서 미저장 입력 보호", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ 지출 추가" }).click();
  await page.getByLabel("금액 (원)").fill("700");
  page.once("dialog", (d) => d.dismiss());
  await page.goBack();
  await expect(page.getByLabel("금액 (원)")).toHaveValue("700");
  page.once("dialog", (d) => d.accept());
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
