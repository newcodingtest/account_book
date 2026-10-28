export const EXPENSE_CATEGORIES = [
  "FOOD",
  "CAFE",
  "TRANSPORT",
  "SHOPPING",
  "LIVING",
  "HOUSING",
  "MEDICAL",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number] | `CUSTOM:${string}`;
export const categoryLabels: Record<(typeof EXPENSE_CATEGORIES)[number], string> = {
  FOOD: "식비",
  CAFE: "카페",
  TRANSPORT: "교통",
  SHOPPING: "쇼핑",
  LIVING: "생활",
  HOUSING: "주거",
  MEDICAL: "의료",
  OTHER: "기타",
};
export function categoryLabel(code: ExpenseCategory): string {
  return code.startsWith("CUSTOM:")
    ? code.slice(7)
    : categoryLabels[code as keyof typeof categoryLabels];
}
export interface Expense {
  id: string;
  amount: number;
  categoryCode: ExpenseCategory;
  spentOn: string;
  merchant: string | null;
  memo: string | null;
  createdAt: number;
  updatedAt: number;
}
