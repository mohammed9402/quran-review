// يولّد أيقونات أندرويد وشاشة البداية من resources/icon-fg.svg (يحتاج Playwright، ويُشغَّل يدويًا عند تغيير التصميم)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const res = path.join(root, "android/app/src/main/res");
const fg = fs.readFileSync(path.join(root, "resources/icon-fg.svg"), "utf8");
const BG = "#0f5c4d";
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const page = (w, h, body) => `<html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden">${body}</body></html>`;
const icon = (size, shape) =>
  `<div style="width:${size}px;height:${size}px;background:${BG};border-radius:${shape === "round" ? "50%" : size * 0.18 + "px"};overflow:hidden">
     <div style="width:${size * 1.5}px;height:${size * 1.5}px;margin:${-size * 0.25}px">${fg}</div></div>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const shot = async (file, w, h, html, transparent) => {
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(page(w, h, html));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await p.screenshot({ path: file, omitBackground: transparent });
  };
  for (const [d, k] of Object.entries(dens)) {
    const s = Math.round(48 * k), f = Math.round(108 * k);
    await shot(`${res}/mipmap-${d}/ic_launcher.png`, s, s, icon(s, "square"), true);
    await shot(`${res}/mipmap-${d}/ic_launcher_round.png`, s, s, icon(s, "round"), true);
    await shot(`${res}/mipmap-${d}/ic_launcher_foreground.png`, f, f, `<div style="width:${f}px;height:${f}px">${fg}</div>`, true);
  }
  const splash = (w, h) =>
    `<div style="width:${w}px;height:${h}px;background:${BG};display:flex;align-items:center;justify-content:center">
       <div style="width:${Math.min(w, h) * 0.55}px;height:${Math.min(w, h) * 0.55}px">${fg}</div></div>`;
  for (const f of fs.readdirSync(res).filter((n) => n.startsWith("drawable"))) {
    const file = `${res}/${f}/splash.png`;
    if (!fs.existsSync(file)) continue;
    const buf = fs.readFileSync(file);
    await shot(file, buf.readUInt32BE(16), buf.readUInt32BE(20), splash(buf.readUInt32BE(16), buf.readUInt32BE(20)), false);
  }
  await shot(path.join(root, "resources/icon-512.png"), 512, 512, icon(512, "square"), true);
  await b.close();
  console.log("done");
})();
