import { useState } from "react";
import type { Expense } from "../../domain/expense";
import { aggregate } from "../statistics/statistics";
import { ExpenseCalendar } from "./ExpenseCalendar";
import { ExpenseList } from "../expense/ExpenseList";
import { money } from "../../shared/utils/money";
export function HistoryPage({
  month,
  rows,
  onEdit,
}: {
  month: string;
  rows: Expense[];
  onEdit: (e: Expense) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const stats = aggregate(rows);
  return (
    <>
      <section>
        <div className="section-heading">
          <h2>소비 캘린더</h2>
          <strong data-testid="monthly-total">{money(stats.total)}</strong>
        </div>
        <ExpenseCalendar
          month={month}
          days={stats.days}
          selected={selected}
          onSelect={(date) => setSelected(selected === date ? null : date)}
        />
      </section>
      <section>
        <div className="section-heading">
          <h2>
            {selected
              ? selected.slice(5).replace("-", "월 ") + "일 내역"
              : "월 전체 내역"}
          </h2>
          {selected && (
            <button onClick={() => setSelected(null)}>전체 보기</button>
          )}
        </div>
        <ExpenseList
          rows={selected ? rows.filter((r) => r.spentOn === selected) : rows}
          onEdit={onEdit}
        />
      </section>
    </>
  );
}
