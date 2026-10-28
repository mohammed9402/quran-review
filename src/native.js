// كل ما يخص قدرات الهاتف (التذكير، المشاركة) معزول هنا، ويعمل بديل بسيط في المتصفح
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const native = Capacitor.isNativePlatform();
const REMINDER_ID = 1;

export async function scheduleReminder({ enabled, hour, minute }) {
  if (!native) return true;
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {});
  if (!enabled) return true;
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return false;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: "ورد المراجعة",
        body: "حان وقت مراجعة وردك اليومي، ثبّتك الله",
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
  await Share.share({ title: "نسخة احتياطية - رفيق المراجعة", url: uri });
}
