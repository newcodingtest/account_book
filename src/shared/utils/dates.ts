const pad = (n: number) => String(n).padStart(2, "0");
export function localDate(d = new Date()) {
  return (
    String(d.getFullYear()).padStart(4, "0") +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate())
  );
}
export function validDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (y < 1 || y > 9999 || m < 1 || m > 12) return false;
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return (
    d >= 1 &&
    d <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
  );
}
export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const index = y * 12 + m - 1 + delta;
  const year = Math.floor(index / 12);
  if (year < 1 || year > 9999)
    throw new Error("지원하는 날짜 범위를 벗어났어요.");
  return String(year).padStart(4, "0") + "-" + pad((index % 12) + 1);
}
export function monthRange(month: string) {
  if (!validDate(month + "-01")) throw new Error("잘못된 월입니다.");
  return [
    month + "-01",
    month === "9999-12" ? "9999-13-01" : shiftMonth(month, 1) + "-01",
  ] as const;
}
export function monthLabel(month: string) {
  const [y, m] = month.split("-");
  return y + "년 " + Number(m) + "월";
}
