import { db, type PocketExpenseDatabase } from "./db";
import {
  expenseInputSchema,
  expenseSchema,
  type ExpenseInput,
} from "../domain/expenseSchema";
import type { Expense } from "../domain/expense";
import { categoryLabels } from "../domain/expense";
import { customCategorySchema } from "../domain/expenseSchema";
import { monthRange } from "../shared/utils/dates";
export const sortExpenses = (a: Expense, b: Expense) =>
  b.spentOn.localeCompare(a.spentOn) ||
  b.createdAt - a.createdAt ||
  a.id.localeCompare(b.id);
export class ExpenseRepository {
  constructor(readonly database: PocketExpenseDatabase = db) {}
  async categories() {
    const saved = await this.database.categories.toArray();
    const used = await this.database.expenses.orderBy("categoryCode").uniqueKeys();
    return [...new Set([...saved.map((c) => c.code), ...used.filter(
      (code): code is `CUSTOM:${string}` => typeof code === "string" && code.startsWith("CUSTOM:"),
    )])];
  }
  async addCategory(name: string) {
    const normalized = name.normalize("NFC").trim();
    const existing = Object.entries(categoryLabels).find(([, label]) => label === normalized);
    if (existing) return existing[0] as Expense["categoryCode"];
    const code = customCategorySchema.parse(`CUSTOM:${normalized}`);
    await this.database.categories.put({ code });
    return code;
  }
  async create(input: ExpenseInput, id: string = crypto.randomUUID()) {
    const now = Date.now();
    const row = expenseSchema.parse({
      ...expenseInputSchema.parse(input),
      id,
      createdAt: now,
      updatedAt: now,
    });
    await this.database.expenses.add(row);
    return row;
  }
  async update(id: string, input: ExpenseInput) {
    const changes = expenseInputSchema.parse(input);
    await this.database.transaction("rw", this.database.expenses, async () => {
      const old = await this.database.expenses.get(id);
      if (!old) throw new Error("기록을 찾을 수 없어요.");
      await this.database.expenses.update(id, {
        ...changes,
        updatedAt: Math.max(Date.now(), old.createdAt),
      });
    });
  }
  async remove(id: string) {
    await this.database.expenses.delete(id);
  }
  async month(month: string) {
    const [start, end] = monthRange(month);
    return (
      await this.database.expenses
        .where("spentOn")
        .between(start, end, true, false)
        .toArray()
    ).sort(sortExpenses);
  }
  async all() {
    return this.database.expenses.toArray();
  }
  async count() {
    return this.database.expenses.count();
  }
}
export const repository = new ExpenseRepository();
