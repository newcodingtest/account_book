import type { Expense } from "../../domain/expense";
import { categoryLabels } from "../../domain/expense";
import { money } from "../../shared/utils/money";
import { aggregate, compare } from "./statistics";
export function StatisticsPage({
  rows,
  previous,
}: {
  rows: Expense[];
  previous: Expense[];
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
        <p className="comparison">{rows.length}건의 지출 기록</p>
      </section>
      <section>
        <h2>카테고리별 소비</h2>
        {stats.total === 0 ? (
          <p className="empty">아직 지출 기록이 없어요</p>
        ) : (
          stats.categories
            .filter((c) => c.amount > 0)
            .map((c) => (
              <div className="category-stat" key={c.code}>
                <div>
                  <strong>{categoryLabels[c.code]}</strong>
                  <span>
                    {money(c.amount)} <small>· {c.percent.toFixed(1)}%</small>
                  </span>
                </div>
                <div className="bar-track">
                  <span style={{ width: c.percent + "%" }} />
                </div>
              </div>
            ))
        )}
      </section>
      <section>
        <h2>전월과 비교</h2>
        <dl className="comparison-list">
          <div>
            <dt>전월 지출</dt>
            <dd>{money(prev.total)}</dd>
          </div>
          <div>
            <dt>이번 달 지출</dt>
            <dd>{money(stats.total)}</dd>
          </div>
          <div>
            <dt>증감액</dt>
            <dd>
              {change.difference > 0 ? "+" : ""}
              {money(change.difference)}
            </dd>
          </div>
          <div>
            <dt>증감률</dt>
            <dd>
              {change.percent === null
                ? "비교 불가"
                : change.percent.toFixed(1) + "%"}
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
