import { monthLabel, shiftMonth } from "../utils/dates";
export function MonthSelector({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className="month-selector">
      <button
        aria-label="이전 달"
        disabled={month === "0001-01"}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        ‹
      </button>
      <h2>{monthLabel(month)}</h2>
      <button
        aria-label="다음 달"
        disabled={month === "9999-12"}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        ›
      </button>
    </div>
  );
}
