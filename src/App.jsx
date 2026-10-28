import { useEffect, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { useStore, getState, setState, saveNow } from "./store.js";
import { ensureToday } from "./schedule.js";
import { today } from "./date.js";
import Setup from "./screens/Setup.jsx";
import Home from "./screens/Home.jsx";
import Review from "./screens/Review.jsx";
import Mushaf from "./screens/Mushaf.jsx";
import Mistakes from "./screens/Mistakes.jsx";
import Settings from "./screens/Settings.jsx";
import Picker from "./screens/Picker.jsx";

const TABS = [
  { name: "home", label: "اليوم", icon: "☀" },
  { name: "mushaf", label: "المصحف", icon: "📖" },
  { name: "mistakes", label: "الأخطاء", icon: "✎" },
  { name: "settings", label: "المزيد", icon: "⚙" },
];

export default function App() {
  const state = useStore();
  const [stack, setStack] = useState([{ name: "home" }]);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  // ورد اليوم يُجدَّد عند فتح التطبيق وعند الرجوع إليه في يوم جديد
  useEffect(() => {
    const refresh = () => {
      if (getState().setupDone) setState((s) => ensureToday(s, today()));
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
    replace: (route) => setStack((s) => [...s.slice(0, -1), route]),
    back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    tab: (name) => setStack([{ name }]),
  };

  if (!state.setupDone) return <Setup />;

  const route = stack[stack.length - 1];
  const showTabs = stack.length === 1;

  return (
    <div className="app">
      <main className={showTabs ? "with-tabs" : ""}>
        <Screen route={route} nav={nav} key={stack.length + route.name} />
      </main>
      {showTabs && (
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.name} className={route.name === t.name ? "active" : ""} onClick={() => nav.tab(t.name)}>
              <span className="tab-icon">{t.icon}</span>
              <span>{t.label}</span>
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
    default:
      return null;
  }
}
