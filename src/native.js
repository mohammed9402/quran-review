// كل ما يخص قدرات الهاتف (التذكير، المشاركة، شريط الحالة) معزول هنا، ويعمل بديل بسيط في المتصفح
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";

const native = Capacitor.isNativePlatform();
const REMINDER_ID = 1;

// لون أيقونات شريط الحالة يتبع المظهر حتى تبقى مقروءة
export function applySystemBars(theme) {
  if (!native) return;
  StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: theme === "dark" ? "#141a18" : "#f2ede1" }).catch(() => {});
}

export async function scheduleReminder({ enabled, hour, minute }, text) {
  if (!native) return true;
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {});
  if (!enabled) return true;
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return false;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: text.title,
        body: text.body,
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      },
    ],
  });
  return true;
}

export async function exportBackup(json) {
  const name = `muraja-backup-${new Date().toISOString().slice(0, 10)}.json`;
  if (!native) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = name;
    a.click();
    return;
  }
  const { uri } = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: "Rafiq al-Muraja'a backup", url: uri });
}

export async function openLink(url) {
  window.open(url, "_system");
}
