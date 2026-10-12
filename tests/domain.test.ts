import { describe, it, expect } from "vitest";
import { expenseInputSchema } from "../src/domain/expenseSchema";
import { localDate, validDate, monthRange } from "../src/shared/utils/dates";
import { safeSum } from "../src/shared/utils/money";
const input = {
  amount: 12000,
  categoryCode: "FOOD",
  spentOn: "2026-10-12",
  merchant: "  식당  ",
  memo: "  ",
};
describe("검증", () => {
  it.each([0, -1, 1.5, NaN, Infinity, 1e9])("잘못된 금액 %s 거부", (amount) =>
    expect(expenseInputSchema.safeParse({ ...input, amount }).success).toBe(
      false,
    ),
  );
  it("카테고리/문자열/날짜", () => {
    expect(expenseInputSchema.parse(input)).toMatchObject({
      merchant: "식당",
      memo: null,
    });
    for (const row of [
      { ...input, categoryCode: "NO" },
      { ...input, merchant: "a".repeat(101) },
      { ...input, memo: "a".repeat(201) },
      { ...input, spentOn: "2026-02-30" },
    ])
      expect(expenseInputSchema.safeParse(row).success).toBe(false);
  });
  it("달력과 월 경계", () => {
    expect(validDate("2028-02-29")).toBe(true);
    expect(validDate("2026-02-29")).toBe(false);
    expect(monthRange("2026-12")).toEqual(["2026-12-01", "2027-01-01"]);
    const d = new Date(2026, 9, 12, 0, 1);
    expect(localDate(d)).toBe("2026-10-12");
  });
  it("안전한 합계", () => {
    expect(safeSum([12000, 5500, 1550])).toBe(19050);
    expect(() => safeSum([Number.MAX_SAFE_INTEGER, 1])).toThrow();
  });
});

it("현지 KST 날짜가 UTC 전날이어도 오늘 유지", () => {
  expect(localDate(new Date("2026-10-11T15:01:00.000Z"))).toBe("2026-10-12");
});
it.each([
  "FOOD",
  "CAFE",
  "TRANSPORT",
  "SHOPPING",
  "LIVING",
  "HOUSING",
  "MEDICAL",
  "OTHER",
])("허용 카테고리 %s", (categoryCode) => {
  expect(expenseInputSchema.safeParse({ ...input, categoryCode }).success).toBe(
    true,
  );
});
it("최대 연도의 월 범위", () => {
  expect(monthRange("9999-12")).toEqual(["9999-12-01", "9999-13-01"]);
});
