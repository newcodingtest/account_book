import { it, expect } from "vitest";
import { aggregate, compare } from "../src/features/statistics/statistics";
import type { Expense } from "../src/domain/expense";
it("월/일/카테고리 합계, 비중, 전월 비교", () => {
  const rows = [12000, 5500, 1550].map((amount, i) => ({
    id: String(i),
    amount,
    categoryCode: i ? "CAFE" : "FOOD",
    spentOn: i ? "2026-10-02" : "2026-10-01",
    merchant: null,
    memo: null,
    createdAt: 1,
    updatedAt: 1,
  })) as Expense[];
  const stats = aggregate(rows);
  expect(stats.total).toBe(19050);
  expect(Object.values(stats.days).reduce((a, b) => a + b, 0)).toBe(
    stats.total,
  );
  expect(stats.categories.reduce((a, b) => a + b.amount, 0)).toBe(stats.total);
  expect(compare(80000, 100000)).toEqual({ difference: -20000, percent: -20 });
  expect(compare(100, 0).percent).toBeNull();
  expect(aggregate([]).categories.every((c) => c.percent === 0)).toBe(true);
  expect(() =>
    aggregate([
      { ...rows[0], amount: Number.MAX_SAFE_INTEGER },
      { ...rows[1], amount: 1 },
    ]),
  ).toThrow();
});
it("카테고리 동률 순서", () => {
  const rows = ["CAFE", "FOOD"].map((categoryCode) => ({
    id: crypto.randomUUID(),
    amount: 100,
    categoryCode,
    spentOn: "2026-10-01",
    merchant: null,
    memo: null,
    createdAt: 1,
    updatedAt: 1,
  })) as Expense[];
  expect(
    aggregate(rows)
      .categories.slice(0, 2)
      .map((c) => c.code),
  ).toEqual(["FOOD", "CAFE"]);
});
