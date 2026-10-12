import { z } from "zod";
import { EXPENSE_CATEGORIES } from "./expense";
import { validDate } from "../shared/utils/dates";
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => v || null);
export const expenseInputSchema = z
  .object({
    amount: z.number().int().min(1).max(999_999_999),
    categoryCode: z.enum(EXPENSE_CATEGORIES),
    spentOn: z.string().refine(validDate, "실제 존재하는 날짜를 입력하세요."),
    merchant: optionalText(100),
    memo: optionalText(200),
  })
  .strict();
export const expenseSchema = expenseInputSchema
  .extend({
    id: z.string().uuid(),
    createdAt: z.number().int().min(0).max(8_640_000_000_000_000),
    updatedAt: z.number().int().min(0).max(8_640_000_000_000_000),
  })
  .refine(
    (v) => v.updatedAt >= v.createdAt,
    "수정시각이 생성시각보다 이릅니다.",
  );
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
