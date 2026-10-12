import { z } from "zod";
import { expenseSchema } from "../../domain/expenseSchema";
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export const MAX_BACKUP_RECORDS = 50_000;
export const backupSchema = z
  .object({
    format: z.literal("pocket-expense-backup"),
    schemaVersion: z.literal(1),
    exportedAt: z.iso.datetime(),
    expenses: z.array(expenseSchema).max(MAX_BACKUP_RECORDS),
  })
  .strict()
  .superRefine((value, ctx) => {
    const ids = new Set<string>();
    for (const row of value.expenses) {
      if (ids.has(row.id)) {
        ctx.addIssue({
          code: "custom",
          message: "중복 ID가 있어요.",
          path: ["expenses"],
        });
        break;
      }
      ids.add(row.id);
    }
  });
export type Backup = z.infer<typeof backupSchema>;
