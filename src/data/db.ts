import Dexie, { type EntityTable } from "dexie";
import type { Expense } from "../domain/expense";
export class PocketExpenseDatabase extends Dexie {
  expenses!: EntityTable<Expense, "id">;
  constructor(name = "pocket-expense-db") {
    super(name);
    this.version(1).stores({
      expenses: "id, spentOn, categoryCode, [spentOn+categoryCode], createdAt",
    });
  }
}
export const db = new PocketExpenseDatabase();
