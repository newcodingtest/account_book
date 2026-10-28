import type { Expense } from "../../domain/expense";
import { categoryLabel } from "../../domain/expense";
import { money } from "../../shared/utils/money";
export function ExpenseList({
  rows,
  onEdit,
}: {
  rows: Expense[];
  onEdit: (e: Expense) => void;
}) {
  return rows.length ? (
    <ul className="expense-list">
      {rows.map((row) => (
        <li key={row.id}>
          <button onClick={() => onEdit(row)}>
            <span className="expense-icon" aria-hidden="true">
              {categoryLabel(row.categoryCode).slice(0, 1)}
            </span>
            <span className="expense-description">
              <strong>
                {row.merchant || categoryLabel(row.categoryCode)}
              </strong>
              <small>
                {row.spentOn} · {categoryLabel(row.categoryCode)}
              </small>
              {row.memo && <small>{row.memo}</small>}
            </span>
            <strong>{money(row.amount)}</strong>
          </button>
        </li>
      ))}
    </ul>
  ) : (
    <div className="empty">
      <span aria-hidden="true">◎</span>
      <p>아직 지출 기록이 없어요</p>
      <small>작은 지출부터 차근차근 기록해 보세요.</small>
    </div>
  );
}
