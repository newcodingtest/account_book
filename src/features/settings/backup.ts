import {
  repository,
  type ExpenseRepository,
} from "../../data/expenseRepository";
import { backupSchema, MAX_BACKUP_BYTES, type Backup } from "./backupSchema";
import { safeSum } from "../../shared/utils/money";
export function parseBackup(text: string) {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES)
    throw new Error("백업 파일은 10 MiB 이하여야 합니다.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("올바른 JSON 파일이 아닙니다.");
  }
  const result = backupSchema.safeParse(value);
  if (!result.success)
    throw new Error(
      "지원하는 버전 1 백업이 아니거나 기록의 필드·금액·날짜·ID·건수에 오류가 있어요.",
    );
  return result.data;
}
export async function readBackup(file: File) {
  if (file.size > MAX_BACKUP_BYTES)
    throw new Error("백업 파일은 10 MiB 이하여야 합니다.");
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new Error("파일을 읽지 못했어요. 다시 선택하세요.");
  }
  return parseBackup(text);
}
export async function exportBackup(repo: ExpenseRepository = repository) {
  const backup = backupSchema.parse({
    format: "pocket-expense-backup",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    expenses: await repo.all(),
  });
  const text = JSON.stringify(backup, null, 2);
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES)
    throw new Error("백업 크기가 복원 한도 10 MiB를 넘어요.");
  return text;
}
export function previewBackup(backup: Backup) {
  const dates = backup.expenses.map((e) => e.spentOn).sort();
  return {
    count: backup.expenses.length,
    total: safeSum(backup.expenses.map((e) => e.amount)),
    start: dates[0] || null,
    end: dates.at(-1) || null,
  };
}
export async function restoreBackup(
  backup: Backup,
  repo: ExpenseRepository = repository,
) {
  const validated = backupSchema.parse(backup);
  return repo.database.transaction("rw", repo.database.expenses, async () => {
    const existing = await repo.database.expenses.toArray();
    const merged = new Map(existing.map((expense) => [expense.id, expense]));
    const changes = validated.expenses.filter((expense) => {
      const current = merged.get(expense.id);
      if (current && current.updatedAt >= expense.updatedAt) return false;
      merged.set(expense.id, expense);
      return true;
    });
    const expected = {
      count: merged.size,
      total: safeSum([...merged.values()].map((expense) => expense.amount)),
    };
    await repo.database.expenses.bulkPut(changes);
    const actual = await repo.database.expenses.toArray();
    const summary = {
      count: actual.length,
      total: safeSum(actual.map((e) => e.amount)),
    };
    if (summary.count !== expected.count || summary.total !== expected.total)
      throw new Error("복원 확인에 실패했어요.");
    return summary;
  });
}
