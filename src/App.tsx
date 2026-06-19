import { useUser, signOut } from "./lib/auth";
import { useLang, setLang, useT } from "./lib/i18n";
import { resetSeed, useActiveGroup } from "./lib/store";
import { useTheme, toggleTheme } from "./lib/theme";
import { personColor, initials } from "./lib/format";
import { Icon } from "./components/Icon";
import { Login } from "./components/Login";
import { Home } from "./components/Home";
import { GroupView } from "./components/GroupView";

export default function App() {
  const user = useUser();
  const t = useT();
  const lang = useLang();
  const theme = useTheme();
  const group = useActiveGroup();

  if (!user) return <Login />;

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-end gap-2">
        <button
          onClick={toggleTheme}
          className="glass rounded-full h-8 w-8 flex items-center justify-center text-muted hover-lift"
          title={theme === "dark" ? "Light" : "Dark"}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
        </button>
        <div className="glass rounded-full p-0.5 flex text-xs font-semibold">
          {(["es", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-full ${lang === l ? "" : "text-muted"}`}
              style={lang === l ? { background: "var(--pill-bg)", color: "var(--pill-fg)" } : undefined}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="glass rounded-full pl-1 pr-1.5 py-1 flex items-center gap-1.5 text-sm">
          <span
            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: personColor(user.name) + "22" }}
          >
            {initials(user.name)}
          </span>
          <span className="font-medium max-w-[90px] truncate">{user.name}</span>
          <button onClick={signOut} className="lk ml-0.5 flex items-center" title={t("app.signout")}>
            <Icon name="power" size={15} />
          </button>
        </div>
      </div>

      {group ? <GroupView group={group} /> : <Home />}

      <footer className="max-w-2xl mx-auto px-4 text-center text-xs text-muted pb-10 leading-relaxed">
        {t("app.footer")}{" "}
        <button onClick={resetSeed} className="lk underline">
          {t("app.resetDemo")}
        </button>
      </footer>
    </div>
  );
}
