// التحقق من صدور إصدار جديد في صفحة Releases على GitHub (الاتصال الوحيد بالإنترنت في التطبيق)
import { getState, setState } from "./store.js";

const API = "https://api.github.com/repos/mohammed9402/quran-review/releases/latest";
const INTERVAL = 12 * 60 * 60 * 1000;

// رقم البناء هو آخر جزء في رقم الإصدار (1.2.0.7 -> 7) ويزيد مع كل إصدار
export const buildOf = (version) => parseInt(String(version).replace(/^v/, "").split(".").pop()) || 0;
export const currentVersion = import.meta.env.VITE_APP_VERSION || "dev";

export async function checkForUpdate({ force = false } = {}) {
  const s = getState();
  if (!force && (!s.settings.checkUpdates || Date.now() - (s.updateCheckedAt || 0) < INTERVAL)) return s.update;
  if (currentVersion === "dev" && !force) return null;
  try {
    const res = await fetch(API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(res.status);
    const rel = await res.json();
    const apk = rel.assets?.find((a) => a.name.endsWith(".apk"));
    const update =
      apk && buildOf(rel.tag_name) > buildOf(currentVersion)
        ? { version: rel.tag_name.replace(/^v/, ""), url: apk.browser_download_url, notes: rel.body || "" }
        : null;
    setState((x) => ({ ...x, update, updateCheckedAt: Date.now() }));
    return update;
  } catch {
    return force ? "error" : s.update;
  }
}

export function dismissUpdate() {
  setState((x) => ({ ...x, dismissedUpdate: x.update?.version }));
}
