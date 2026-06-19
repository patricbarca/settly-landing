import { useState } from "react";
import { useGroups, setActiveGroup, archiveGroup } from "../lib/store";
import { computeSettle } from "../lib/split";
import { groupSettleScore } from "../lib/gamification";
import { money, personColor, initials } from "../lib/format";
import { useT } from "../lib/i18n";
import { Logo } from "./Logo";
import { Icon, type IconName } from "./Icon";
import { SettleRing } from "./SettleRing";
import { CreateGroupModal } from "./CreateGroupModal";

export function Home() {
  const t = useT();
  const groups = useGroups();
  const [creating, setCreating] = useState(false);
  const [showArch, setShowArch] = useState(false);

  const active = groups.filter((g) => !g.archived);
  const archived = groups.filter((g) => g.archived);

  const FEATURES: { icon: IconName; title: string; desc: string }[] = [
    { icon: "mic", title: t("home.featVoiceT"), desc: t("home.featVoiceD") },
    { icon: "balance", title: t("home.featClearT"), desc: t("home.featClearD") },
    { icon: "users", title: t("home.featGroupT"), desc: t("home.featGroupD") },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      <div className="pt-4">
        <div className="hero anim-up">
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
          <div className="relative z-10 flex flex-col items-center text-center py-3">
            <div className="glass rounded-3xl p-3 mb-4">
              <Logo size={54} />
            </div>
            <h1 className="text-white font-display text-5xl font-extrabold tracking-tight">Settly</h1>
            <p className="text-white/85 text-base mt-2.5 max-w-md leading-relaxed">{t("login.tagline")}</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-5 rounded-full px-6 py-3 font-semibold hover-lift text-[#241C53] inline-flex items-center gap-1.5"
              style={{ background: "#fff" }}
            >
              <Icon name="plus" size={18} /> {t("home.createGroup")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass rounded-2xl p-4">
            <Icon name={f.icon} size={22} className="text-[color:var(--indigo)]" />
            <div className="font-semibold mt-2">{f.title}</div>
            <div className="text-sm text-muted mt-0.5 leading-snug">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 mb-2 px-1">
        <h2 className="font-display text-xl font-bold">{t("home.yourGroups")}</h2>
        <button
          onClick={() => setCreating(true)}
          className="glass rounded-full px-3 py-1.5 text-sm hover-lift text-muted inline-flex items-center gap-1"
        >
          <Icon name="plus" size={15} /> {t("home.new")}
        </button>
      </div>

      <div className="space-y-2">
        {active.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-muted">{t("home.empty")}</div>
        )}
        {active.map((g) => {
          const { net } = computeSettle(g.members, g.expenses, g.settlements ?? []);
          const mine = net[g.meId] || 0;
          const total = g.expenses.reduce((s, e) => s + e.amount, 0);
          const ok = Math.abs(mine) < 0.01;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className="glass rounded-2xl p-4 w-full text-left hover-lift flex items-center gap-3"
            >
              <div className="shrink-0">
                <SettleRing value={groupSettleScore(g)} size={44} stroke={5} color="#0FA3A3" track="var(--line)" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg font-bold truncate">{g.name}</div>
                <div className="text-xs text-muted mt-0.5">
                  {t("home.meta", { p: g.members.length, amt: money(total, g.currency), e: g.expenses.length })}
                </div>
                <div className="flex -space-x-2 mt-2">
                  {g.members.slice(0, 6).map((m) => (
                    <span
                      key={m.id}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold border-2"
                      style={{ background: personColor(m.name) + "33", borderColor: "var(--ring)" }}
                    >
                      {initials(m.name)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] uppercase tracking-wide font-mono text-muted">{t("home.yourBalance")}</div>
                <div
                  className="font-mono font-bold"
                  style={{ color: ok ? "var(--muted)" : mine > 0 ? "#0A8B5E" : "#D14444" }}
                >
                  {ok ? t("bal.uptodate") : mine > 0 ? `+${money(mine, g.currency)}` : `−${money(-mine, g.currency)}`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {archived.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowArch((v) => !v)}
            className="lk text-sm font-medium inline-flex items-center gap-1"
          >
            <Icon name="chevron" size={14} style={{ transform: showArch ? "rotate(180deg)" : "none" }} />
            {t("home.archived")} ({archived.length})
          </button>
          {showArch && (
            <div className="space-y-1.5 mt-2">
              {archived.map((g) => {
                const total = g.expenses.reduce((s, e) => s + e.amount, 0);
                return (
                  <div key={g.id} className="glass rounded-2xl p-3 flex items-center gap-2" style={{ opacity: 0.8 }}>
                    <button onClick={() => setActiveGroup(g.id)} className="flex-1 text-left min-w-0">
                      <div className="font-semibold truncate">{g.name}</div>
                      <div className="text-xs text-muted">
                        {t("home.meta", { p: g.members.length, amt: money(total, g.currency), e: g.expenses.length })}
                      </div>
                    </button>
                    <button
                      onClick={() => archiveGroup(g.id, false)}
                      className="glass rounded-full px-3 py-1 text-xs hover-lift text-muted shrink-0"
                    >
                      {t("home.restore")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {creating && <CreateGroupModal onClose={() => setCreating(false)} />}
    </div>
  );
}
