import Dexie, { type EntityTable } from "dexie";
import type { Expense } from "../domain/expense";
export class PocketExpenseDatabase extends Dexie {
  expenses!: EntityTable<Expense, "id">;
  categories!: EntityTable<{ code: `CUSTOM:${string}` }, "code">;
  constructor(name = "pocket-expense-db") {
    super(name);
    this.version(1).stores({
      expenses: "id, spentOn, categoryCode, [spentOn+categoryCode], createdAt",
    });
    this.version(2).stores({ categories: "code" });
  }
}
export const db = new PocketExpenseDatabase();
