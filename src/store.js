// حالة التطبيق كلها في كائن واحد يُحفظ على الجهاز (Preferences في أندرويد، localStorage في المتصفح)
import { useSyncExternalStore } from "react";
import { Preferences } from "@capacitor/preferences";

const KEY = "muraja-state-v1";

export const initialState = {
  version: 1,
  setupDone: false,
  settings: { dailyPages: 5, fontSize: 26, reminder: { enabled: false, hour: 5, minute: 30 } },
  memorized: [],
  cards: {},
  today: null,
  mistakes: {},
  history: {},
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
    settings: { ...initialState.settings, ...data.settings, reminder: { ...initialState.settings.reminder, ...data.settings?.reminder } },
  };
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
