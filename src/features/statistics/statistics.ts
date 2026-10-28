import { EXPENSE_CATEGORIES } from "../../domain/expense";
import type { Expense } from "../../domain/expense";
import { safeSum } from "../../shared/utils/money";
export function aggregate(rows: Expense[]) {
  const total = safeSum(rows.map((r) => r.amount));
  const days: Record<string, number> = {};
  for (const row of rows)
    days[row.spentOn] = safeSum([days[row.spentOn] || 0, row.amount]);
  const codes = [...new Set([...EXPENSE_CATEGORIES, ...rows.map((r) => r.categoryCode)])];
  const categories = codes.map((code, index) => {
    const amount = safeSum(
      rows.filter((r) => r.categoryCode === code).map((r) => r.amount),
    );
    return { code, index, amount, percent: total ? (amount / total) * 100 : 0 };
  }).sort((a, b) => b.amount - a.amount || a.index - b.index);
  return { total, days, categories };
}
export function compare(current: number, previous: number) {
  return {
    difference: current - previous,
    percent: previous === 0 ? null : ((current - previous) / previous) * 100,
  };
}
