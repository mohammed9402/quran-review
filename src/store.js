// حالة التطبيق كلها في كائن واحد يُحفظ على الجهاز (Preferences في أندرويد، localStorage في المتصفح)
import { useSyncExternalStore } from "react";
import { Preferences } from "@capacitor/preferences";

const KEY = "muraja-state-v1";

// بيانات المراجعة الخاصة بكل رواية؛ بيانات الرواية الحالية في أعلى الحالة، والباقي محفوظ في profiles
export const PROFILE_KEYS = ["memorized", "cards", "today", "cycle", "mistakes", "history"];
export const emptyProfile = () => ({ memorized: [], cards: {}, today: null, cycle: null, mistakes: {}, history: {} });

export const initialState = {
  version: 2,
  setupDone: false,
  riwaya: "hafs",
  profiles: {},
  settings: {
    lang: "ar",
    theme: "light",
    quranFont: "uthmani",
    checkUpdates: true,
    dailyPages: 5,
    fontSize: 26,
    testMode: true,
    reminder: { enabled: false, hour: 5, minute: 30 },
  },
  update: null,
  updateCheckedAt: 0,
  dismissedUpdate: null,
  ...emptyProfile(),
};

let state = initialState;
const listeners = new Set();
let saveTimer;

export async function loadState() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (value) state = normalize(JSON.parse(value));
  } catch (e) {
    console.error("تعذّر تحميل البيانات", e);
  }
  return state;
}

export function normalize(data) {
  return {
    ...initialState,
    ...data,
    version: initialState.version,
    profiles: data.profiles || {},
    settings: { ...initialState.settings, ...data.settings, reminder: { ...initialState.settings.reminder, ...data.settings?.reminder } },
  };
}

// التبديل بين الروايات: تُحفظ بيانات الرواية الحالية وتُحمَّل بيانات الأخرى.
// إذا كانت الرواية الجديدة بلا محفوظ نسخنا قائمة المحفوظ (الصفحات متطابقة في المصحفين) ببطاقات جديدة.
export function switchRiwaya(s, id) {
  if (s.riwaya === id) return s;
  const current = Object.fromEntries(PROFILE_KEYS.map((k) => [k, s[k]]));
  const saved = s.profiles[id];
  const next = saved?.memorized?.length ? saved : { ...emptyProfile(), memorized: [...s.memorized] };
  return { ...s, ...next, riwaya: id, profiles: { ...s.profiles, [s.riwaya]: current, [id]: undefined } };
}

export function getState() {
  return state;
}

export function setState(update) {
  state = typeof update === "function" ? update(state) : update;
  listeners.forEach((l) => l());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 300);
}

export function saveNow() {
  clearTimeout(saveTimer);
  return Preferences.set({ key: KEY, value: JSON.stringify(state) });
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore() {
  return useSyncExternalStore(subscribe, getState);
}
