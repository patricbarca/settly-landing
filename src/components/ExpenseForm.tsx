import { useState } from "react";
import type { Category, Group } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { personColor, initials, money } from "../lib/format";
import { currencySymbol } from "../lib/currencies";
import { useT } from "../lib/i18n";
import { Icon } from "./Icon";

export interface ExpenseDraft {
  label: string;
  amount: number | string;
  payerId: string;
  participantIds: string[];
  category: Category;
}

export function ExpenseForm({
  group,
  initial,
  onSave,
  onCancel,
  submitLabel,
}: {
  group: Group;
  initial: ExpenseDraft;
  onSave: (d: ExpenseDraft) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const t = useT();
  const [f, setF] = useState<ExpenseDraft>(initial);
  const up = <K extends keyof ExpenseDraft>(k: K, v: ExpenseDraft[K]) =>
    setF((s) => ({ ...s, [k]: v }));
  const toggle = (id: string) =>
    setF((s) => ({
      ...s,
      participantIds: s.participantIds.includes(id)
        ? s.participantIds.filter((x) => x !== id)
        : [...s.participantIds, id],
    }));

  const amt = Number(f.amount) || 0;
  const per = f.participantIds.length ? amt / f.participantIds.length : 0;
  const valid = String(f.label).trim() && amt > 0 && f.participantIds.length > 0;

  function save() {
    if (!valid) return;
    onSave({ ...f, amount: amt });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={f.label}
          onChange={(e) => up("label", e.target.value)}
          placeholder={t("form.concept")}
          className="glass rounded-xl px-3 py-2.5 text-sm flex-1"
        />
        <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-1 w-32 shrink-0">
          <input
            value={f.amount}
            onChange={(e) => up("amount", e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="bg-transparent text-sm w-full text-right font-mono"
          />
          <span className="text-muted text-sm">{currencySymbol(group.currency)}</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted">{t("form.paid")}</label>
        <div className="flex gap-1.5 flex-wrap mt-1">
          {group.members.map((m) => {
            const on = f.payerId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => up("payerId", m.id)}
                className={`rounded-full pl-1 pr-3 py-1 text-sm flex items-center gap-1.5 border ${on ? "surface font-semibold" : "glass text-muted"}`}
                style={{ borderColor: on ? personColor(m.name) : "transparent" }}
              >
                <span
                  className="h-6 w-6 rounded-full flex items-center justify-center text-sm"
                  style={{ background: personColor(m.name) + "22" }}
                >
                  {m.avatar || initials(m.name)}
                </span>
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted">
          {t("form.between")}{" "}
          {f.participantIds.length > 0 && (
            <span className="font-normal">
              · {money(per, group.currency)} {t("form.each")}
            </span>
          )}
        </label>
        <div className="flex gap-1.5 flex-wrap mt-1">
          {group.members.map((m) => {
            const on = f.participantIds.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`rounded-full pl-1 pr-3 py-1 text-sm flex items-center gap-1.5 border ${on ? "surface" : "glass"}`}
                style={{ borderColor: on ? personColor(m.name) : "transparent", opacity: on ? 1 : 0.5 }}
              >
                <span
                  className="h-6 w-6 rounded-full flex items-center justify-center text-sm"
                  style={{ background: personColor(m.name) + "22" }}
                >
                  {m.avatar || initials(m.name)}
                </span>
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted">{t("form.category")}</label>
        <div className="flex gap-1.5 flex-wrap mt-1">
          {CATEGORIES.map((c) => {
            const on = f.category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => up("category", c.id)}
                className={`rounded-full px-3 py-1 text-sm inline-flex items-center gap-1.5 ${on ? "" : "glass text-muted"}`}
                style={on ? { background: "var(--pill-bg)", color: "var(--pill-fg)" } : undefined}
              >
                <Icon name={c.icon} size={15} /> {t(`cat.${c.id}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={save}
          disabled={!valid}
          className="glass-strong rounded-full px-5 py-2.5 font-medium hover-lift disabled:opacity-50"
        >
          {submitLabel ?? t("common.save")}
        </button>
        <button onClick={onCancel} className="glass rounded-full px-5 py-2.5 hover-lift text-muted">
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
