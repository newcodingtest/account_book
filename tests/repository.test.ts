import { it, expect } from "vitest";
import { PocketExpenseDatabase } from "../src/data/db";
import { ExpenseRepository } from "../src/data/expenseRepository";
it("CRUD, 중복키, 없는 ID, 월 경계와 정렬", async () => {
  const db = new PocketExpenseDatabase("test-" + crypto.randomUUID());
  const repo = new ExpenseRepository(db);
  const input = {
    amount: 100,
    categoryCode: "FOOD" as const,
    spentOn: "2026-10-01",
    merchant: null,
    memo: null,
  };
  try {
    const a = await repo.create(input);
    await expect(
      repo.create({ ...input, amount: 999 }, a.id),
    ).rejects.toThrow();
    await repo.create({ ...input, spentOn: "2026-11-01" });
    expect(await repo.month("2026-10")).toHaveLength(1);
    await repo.update(a.id, { ...input, amount: 200 });
    expect((await repo.month("2026-10"))[0]).toMatchObject({
      id: a.id,
      amount: 200,
      createdAt: a.createdAt,
    });
    await expect(repo.update(crypto.randomUUID(), input)).rejects.toThrow(
      "기록",
    );
    await repo.remove(a.id);
    expect(await repo.month("2026-10")).toHaveLength(0);
  } finally {
    await db.delete();
  }
});
