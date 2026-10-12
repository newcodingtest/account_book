import { validDate } from "../../shared/utils/dates";
import { money } from "../../shared/utils/money";
export function ExpenseCalendar({
  month,
  days,
  selected,
  onSelect,
}: {
  month: string;
  days: Record<string, number>;
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(0);
  first.setFullYear(y, m - 1, 1);
  first.setHours(0, 0, 0, 0);
  const dates = Array.from(
    { length: 31 },
    (_, i) => month + "-" + String(i + 1).padStart(2, "0"),
  ).filter(validDate);
  return (
    <div className="calendar" aria-label="소비 캘린더">
      <div className="weekdays">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: first.getDay() }, (_, i) => (
          <span key={"empty" + i} />
        ))}
        {dates.map((date) => (
          <button
            key={date}
            aria-label={
              date + (days[date] ? " 지출 " + money(days[date]) : " 지출 없음")
            }
            aria-pressed={selected === date}
            onClick={() => onSelect(date)}
          >
            <span>{Number(date.slice(-2))}</span>
            {days[date] > 0 && (
              <small>
                {new Intl.NumberFormat("ko-KR", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(days[date])}
              </small>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
