export const money = (n: number) =>
  new Intl.NumberFormat("ko-KR").format(n) + "원";
export function safeSum(values: number[]) {
  let sum = 0;
  for (const value of values) {
    if (
      !Number.isSafeInteger(value) ||
      value < 0 ||
      !Number.isSafeInteger(sum + value)
    )
      throw new Error("합계가 안전한 정수 범위를 벗어났어요.");
    sum += value;
  }
  return sum;
}
