import type { Expense } from "../../domain/expense";
import { categoryLabel } from "../../domain/expense";
import { aggregate, compare } from "../statistics/statistics";
import { money } from "../../shared/utils/money";
import { ExpenseList } from "../expense/ExpenseList";
export function HomePage({
  rows,
  previous,
  onEdit,
}: {
  rows: Expense[];
  previous: Expense[];
  onEdit: (e: Expense) => void;
}) {
  const stats = aggregate(rows),
    prev = aggregate(previous),
    change = compare(stats.total, prev.total);
  return (
    <>
      <section className="total-card">
        <p>이번 달 총지출</p>
        <strong className="total" data-testid="monthly-total">
          {money(stats.total)}
        </strong>
        <p className="comparison">
          전월 {money(prev.total)} ·{" "}
          {change.percent === null
            ? "비교 불가"
            : (change.difference > 0 ? "+" : "") +
              money(change.difference) +
              " (" +
              change.percent.toFixed(1) +
              "%)"}
        </p>
      </section>
      <div className="section-heading">
        <h2>지출 상위 카테고리</h2>
        <small>이번 달</small>
      </div>
      <div className="top-categories">
        {stats.categories
          .filter((c) => c.amount > 0)
          .slice(0, 3)
          .map((c) => (
            <div key={c.code}>
              <small>{categoryLabel(c.code)}</small>
              <strong>{money(c.amount)}</strong>
            </div>
          ))}
      </div>
      <section>
        <div className="section-heading">
          <h2>최근 지출</h2>
          <small>최근 5건</small>
        </div>
        <ExpenseList rows={rows.slice(0, 5)} onEdit={onEdit} />
      </section>
    </>
  );
}
