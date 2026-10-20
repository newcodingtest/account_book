import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Expense } from "../../domain/expense";
import { EXPENSE_CATEGORIES, categoryLabels } from "../../domain/expense";
import { expenseInputSchema } from "../../domain/expenseSchema";
import { repository } from "../../data/expenseRepository";
import { localDate } from "../../shared/utils/dates";
import { Modal } from "../../shared/components/Modal";
export function ExpenseEditor({
  expense,
  onClose,
  onDirty,
  onBusy,
  update,
}: {
  expense: Expense | null;
  onClose: () => void;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
  update: { needed: boolean; apply: () => void };
}) {
  const initialRef = useRef({
    amount: expense ? String(expense.amount) : "",
    categoryCode: expense?.categoryCode || "",
    spentOn: expense?.spentOn || localDate(),
    merchant: expense?.merchant || "",
    memo: expense?.memo || "",
  });
  const initial = initialRef.current;
  const [form, setForm] = useState(initial);
  const amountInput = useRef<HTMLInputElement>(null);
  const amountCaret = useRef<number | null>(null);
  const formattedAmount = form.amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  useLayoutEffect(() => {
    if (amountCaret.current === null) return;
    const digitsBeforeCaret = amountCaret.current;
    let position = 0;
    let digits = 0;
    while (position < formattedAmount.length && digits < digitsBeforeCaret) {
      if (formattedAmount[position] !== ",") digits++;
      position++;
    }
    amountInput.current?.setSelectionRange(position, position);
    amountCaret.current = null;
  });
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    onBusy(busy);
    return () => onBusy(false);
  }, [busy, onBusy]);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => {
    onDirty(dirty);
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      onDirty(false);
      window.removeEventListener("beforeunload", handler);
    };
  }, [dirty, onDirty]);
  const close = () => {
    if (!busy && (!dirty || window.confirm("저장하지 않은 변경을 버릴까요?")))
      onClose();
  };
  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    setError("");
    if (!/^\d+$/.test(form.amount)) {
      setError("금액은 1원 이상 원 단위 정수로 입력하세요.");
      return;
    }
    const parsed = expenseInputSchema.safeParse({
      ...form,
      amount: Number(form.amount),
    });
    if (!parsed.success) {
      setError("금액(1~999,999,999원), 카테고리, 날짜와 글자 수를 확인하세요.");
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      if (expense) await repository.update(expense.id, parsed.data);
      else await repository.create(parsed.data);
      onClose();
    } catch {
      setError(
        "저장하지 못했어요. 저장소 접근 또는 용량을 확인하고 다시 시도하세요.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function remove() {
    if (
      lock.current ||
      !expense ||
      !window.confirm("이 지출 기록을 삭제할까요?")
    )
      return;
    lock.current = true;
    setBusy(true);
    try {
      await repository.remove(expense.id);
      onClose();
    } catch {
      setError("삭제하지 못했어요. 다시 시도하세요.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal title={expense ? "지출 수정" : "지출 추가"} onClose={close}>
      <>
        {update.needed && (
          <aside className="notice">
            새 버전이 준비됐어요.
            <button disabled={busy} type="button" onClick={update.apply}>
              업데이트
            </button>
          </aside>
        )}
        <form onSubmit={(e) => void submit(e)}>
          <fieldset disabled={busy}>
            <label>
              금액 (원)
              <input
                autoFocus
                data-autofocus
                inputMode="numeric"
                ref={amountInput}
                value={formattedAmount}
                onChange={(e) => {
                  const input = e.target;
                  const raw = input.value.replace(/,/g, "");
                  if (!/^\d*$/.test(raw) || raw.length > 9) return;
                  amountCaret.current = input.value
                    .slice(0, input.selectionStart ?? input.value.length)
                    .replace(/,/g, "").length;
                  set("amount", raw);
                }}
                placeholder="0"
                required
                maxLength={11}
              />
            </label>
            <fieldset className="category-grid">
              <legend>카테고리</legend>
              {EXPENSE_CATEGORIES.map((code) => (
                <label
                  className={form.categoryCode === code ? "selected" : ""}
                  key={code}
                >
                  <input
                    type="radio"
                    name="category"
                    value={code}
                    checked={form.categoryCode === code}
                    onChange={() => set("categoryCode", code)}
                    required
                  />
                  {categoryLabels[code]}
                </label>
              ))}
            </fieldset>
            <label>
              날짜
              <input
                type="date"
                value={form.spentOn}
                onChange={(e) => set("spentOn", e.target.value)}
                min="0001-01-01"
                max="9999-12-31"
                required
              />
            </label>
            <label>
              사용처 <small>선택</small>
              <input
                value={form.merchant}
                onChange={(e) => set("merchant", e.target.value)}
                maxLength={100}
                placeholder="어디에 사용했나요?"
              />
            </label>
            <label>
              메모 <small>선택</small>
              <textarea
                value={form.memo}
                onChange={(e) => set("memo", e.target.value)}
                maxLength={200}
                rows={2}
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary full" type="submit">
              {busy ? "저장 중…" : "저장"}
            </button>
            {expense && (
              <button
                type="button"
                className="danger full"
                onClick={() => void remove()}
              >
                지출 삭제
              </button>
            )}
          </fieldset>
        </form>
      </>
    </Modal>
  );
}
