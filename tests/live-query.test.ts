import { it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { liveQuery } from "dexie";
import { PocketExpenseDatabase } from "../src/data/db";
import { ExpenseRepository } from "../src/data/expenseRepository";
it("변경 관찰, 월 경계와 결정적 정렬", async () => {
  const db = new PocketExpenseDatabase("live-" + crypto.randomUUID());
  const repo = new ExpenseRepository(db);
  let amounts: number[] = [];
  const sub = liveQuery(() => repo.month("2026-10")).subscribe((rows) => {
    amounts = rows.map((r) => r.amount);
  });
  try {
    const base = {
      categoryCode: "FOOD" as const,
      merchant: null,
      memo: null,
      updatedAt: 3,
    };
    await db.expenses.bulkAdd([
      { ...base, id: "b", spentOn: "2026-10-01", createdAt: 1, amount: 1 },
      { ...base, id: "a", spentOn: "2026-10-01", createdAt: 1, amount: 2 },
      { ...base, id: "c", spentOn: "2026-10-01", createdAt: 2, amount: 3 },
      { ...base, id: "d", spentOn: "2026-10-31", createdAt: 1, amount: 4 },
      { ...base, id: "e", spentOn: "2026-11-01", createdAt: 1, amount: 5 },
    ]);
    await waitFor(() => expect(amounts).toEqual([4, 3, 2, 1]));
    await repo.remove("d");
    await waitFor(() => expect(amounts).toEqual([3, 2, 1]));
  } finally {
    sub.unsubscribe();
    await db.delete();
  }
});
