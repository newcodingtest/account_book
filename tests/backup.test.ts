import type { Expense } from "../src/domain/expense";
import { it, expect, vi } from "vitest";
import { PocketExpenseDatabase } from "../src/data/db";
import { ExpenseRepository } from "../src/data/expenseRepository";
import {
  exportBackup,
  parseBackup,
  restoreBackup,
  readBackup,
  previewBackup,
} from "../src/features/settings/backup";
import {
  MAX_BACKUP_BYTES,
  backupSchema,
} from "../src/features/settings/backupSchema";
const row = (): Expense => ({
  id: crypto.randomUUID(),
  amount: 12000,
  categoryCode: "FOOD" as const,
  spentOn: "2026-10-12",
  merchant: "식당",
  memo: null,
  createdAt: 1,
  updatedAt: 1,
});
const backup = (expenses = [row()]) => ({
  format: "pocket-expense-backup" as const,
  schemaVersion: 1 as const,
  exportedAt: "2026-10-12T00:00:00.000Z",
  expenses,
});
it.each([0, 1, 3])("%s건 백업 왕복과 저장 후 실제 건수/합계", async (count) => {
  const db = new PocketExpenseDatabase("backup-" + crypto.randomUUID());
  const repo = new ExpenseRepository(db);
  try {
    const original = backup(Array.from({ length: count }, row));
    await restoreBackup(original, repo);
    const text = await exportBackup(repo);
    expect(parseBackup(text).expenses).toEqual(
      expect.arrayContaining(original.expenses),
    );
    await db.expenses.clear();
    expect(await restoreBackup(parseBackup(text), repo)).toEqual({
      count,
      total: count * 12000,
    });
    expect(await repo.count()).toBe(count);
  } finally {
    await db.delete();
  }
});
it("스키마/깨진 JSON/빈 파일/한도/필드 누락/잘못된 행 거부", async () => {
  for (const text of [
    "",
    "{",
    JSON.stringify({ ...backup(), schemaVersion: 2 }),
    JSON.stringify({ ...backup(), exportedAt: "no" }),
    JSON.stringify(backup([{ ...row(), amount: 0 }])),
    JSON.stringify(backup([{ ...row(), spentOn: "2026-02-30" }])),
    JSON.stringify(backup([{ ...row(), categoryCode: "NO" }] as never)),
    JSON.stringify(backup([{ ...row(), id: "no" }])),
    JSON.stringify(backup([{ ...row(), memo: undefined }] as never)),
  ])
    expect(() => parseBackup(text)).toThrow();
  const duplicate = row();
  expect(() =>
    parseBackup(JSON.stringify(backup([duplicate, duplicate]))),
  ).toThrow();
  expect(
    backupSchema.safeParse(backup(Array.from({ length: 50001 }, row))).success,
  ).toBe(false);
  await expect(
    readBackup({
      size: MAX_BACKUP_BYTES + 1,
      text: vi.fn(),
    } as unknown as File),
  ).rejects.toThrow("10 MiB");
  expect(() => parseBackup(" ".repeat(MAX_BACKUP_BYTES + 1))).toThrow("10 MiB");
  await expect(
    readBackup({
      size: 1,
      text: async () => {
        throw new Error();
      },
    } as unknown as File),
  ).rejects.toThrow("읽지");
});
it("일부 삽입 후 실패하면 기존 데이터 트랜잭션 롤백", async () => {
  const db = new PocketExpenseDatabase("rollback-" + crypto.randomUUID());
  const repo = new ExpenseRepository(db);
  const old = row(),
    next = row();
  try {
    await db.expenses.add(old);
    const spy = vi.spyOn(db.expenses, "bulkAdd").mockImplementation(() =>
      db.expenses.add(next).then(() => {
        throw new Error("injected partial failure");
      }),
    );
    await expect(restoreBackup(backup([next]), repo)).rejects.toThrow(
      "injected",
    );
    spy.mockRestore();
    expect(await repo.all()).toEqual([old]);
  } finally {
    await db.delete();
  }
});
it("미리보기는 DB를 변경하지 않음", async () => {
  const db = new PocketExpenseDatabase("preview-" + crypto.randomUUID());
  const repo = new ExpenseRepository(db);
  try {
    await db.expenses.add(row());
    const before = await repo.all();
    expect(previewBackup(parseBackup(JSON.stringify(backup()))).count).toBe(1);
    expect(await repo.all()).toEqual(before);
  } finally {
    await db.delete();
  }
});
