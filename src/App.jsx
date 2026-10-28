import { useEffect, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { useStore, getState, setState, saveNow } from "./store.js";
import { ensureToday } from "./schedule.js";
import { today } from "./date.js";
import { useI18n } from "./i18n.js";
import { applySystemBars } from "./native.js";
import Setup from "./screens/Setup.jsx";
import Home from "./screens/Home.jsx";
import Review from "./screens/Review.jsx";
import Mushaf from "./screens/Mushaf.jsx";
import Mistakes from "./screens/Mistakes.jsx";
import Settings from "./screens/Settings.jsx";
import Picker from "./screens/Picker.jsx";
import Developer from "./screens/Developer.jsx";
import NewPlan from "./screens/NewPlan.jsx";
import { checkForUpdate } from "./updates.js";

const TABS = [
  { name: "home", label: "tab_today", icon: "☀" },
  { name: "mushaf", label: "tab_mushaf", icon: "📖" },
  { name: "mistakes", label: "tab_mistakes", icon: "✎" },
  { name: "settings", label: "tab_more", icon: "⚙" },
];

// المظهر الفعلي: "auto" يتبع إعداد الهاتف
function useResolvedTheme(theme) {
  const query = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
  const [systemDark, setSystemDark] = useState(query?.matches ?? false);
  useEffect(() => {
    if (!query) return;
    const on = (e) => setSystemDark(e.matches);
    query.addEventListener("change", on);
    return () => query.removeEventListener("change", on);
  }, []);
  return theme === "auto" ? (systemDark ? "dark" : "light") : theme;
}

export default function App() {
  const state = useStore();
  const { t, dir, lang } = useI18n();
  const theme = useResolvedTheme(state.settings.theme);
  const [stack, setStack] = useState([{ name: "home" }]);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dir = dir;
    root.lang = lang;
    applySystemBars(theme);
  }, [theme, dir, lang]);

  // ورد اليوم يُجدَّد عند فتح التطبيق وعند الرجوع إليه في يوم جديد
  useEffect(() => {
    const refresh = () => {
      const s = getState();
      if (s.setupDone && s.memorized.length) setState((x) => ensureToday(x, today()));
      checkForUpdate();
    };
    refresh();
    const sub = CapApp.addListener("appStateChange", ({ isActive }) => (isActive ? refresh() : saveNow()));
    const onVisible = () => (document.hidden ? saveNow() : refresh());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      sub.then((h) => h.remove());
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const sub = CapApp.addListener("backButton", () => {
      const s = stackRef.current;
      if (s.length > 1) setStack(s.slice(0, -1));
      else if (s[0].name !== "home") setStack([{ name: "home" }]);
      else CapApp.exitApp();
    });
    return () => sub.then((h) => h.remove());
  }, []);

  const nav = {
    push: (route) => setStack((s) => [...s, route]),
    back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    tab: (name) => setStack([{ name }]),
  };

  if (!state.setupDone) return <Setup />;

  const route = stack[stack.length - 1];
  const showTabs = stack.length === 1;

  return (
    <div className="app">
      <main className={showTabs ? "with-tabs" : ""}>
        <Screen route={route} nav={nav} key={stack.length + route.name + state.riwaya} />
      </main>
      {showTabs && (
        <nav className="tabs">
          {TABS.map((tab) => (
            <button key={tab.name} className={route.name === tab.name ? "active" : ""} onClick={() => nav.tab(tab.name)}>
              <span className="tab-icon">{tab.icon}</span>
              <span>{t(tab.label)}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function Screen({ route, nav }) {
  switch (route.name) {
    case "home":
      return <Home nav={nav} />;
    case "review":
      return <Review nav={nav} {...route} />;
    case "mushaf":
      return <Mushaf nav={nav} />;
    case "mistakes":
      return <Mistakes nav={nav} />;
    case "settings":
      return <Settings nav={nav} />;
    case "picker":
      return <Picker nav={nav} />;
    case "developer":
      return <Developer nav={nav} />;
    case "newplan":
      return <NewPlan nav={nav} />;
    default:
      return null;
  }
}
