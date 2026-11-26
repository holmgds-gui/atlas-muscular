/* Muscle Atlas for Windows (owner, nov/2026: "me envie o link .exe para baixar no meu pc").
   It opens the published app in its own window, so it always has the newest version and works offline after the
   first visit (the site's service worker). Google sign-in opens in a small window, like in the browser. */
const { app, BrowserWindow, shell, Menu, session } = require("electron");
const path = require("path");
const fs = require("fs");

const URL0 = "https://holmgds-gui.github.io/atlas-muscular/";
const HOST = "holmgds-gui.github.io";
const AUTH = [/^https:\/\/holmgds-gui\.github\.io\/__\/auth\//, /^https:\/\/accounts\.google\.com\//, /^https:\/\/[^/]+\.firebaseapp\.com\/__\/auth\//];

// Google refuses sign-in from apps that say "Electron" in the user agent: use the plain Chrome one.
app.userAgentFallback = app.userAgentFallback.replace(/\s?Electron\/\S+/, "").replace(/\s?muscle-atlas-desktop\/\S+/, "");

if (!app.requestSingleInstanceLock()) app.quit();

const stateFile = () => path.join(app.getPath("userData"), "janela.json");
const loadState = () => { try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch (e) { return {}; } };
const saveState = (w) => { try { const b = w.getNormalBounds(); fs.writeFileSync(stateFile(), JSON.stringify({ ...b, max: w.isMaximized() })); } catch (e) {} };

let win = null;
// security (0.61): the app never asks for camera, microphone, location etc.; any such request is refused
function lockPermissions() {
  const { session } = require("electron");
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(["clipboard-sanitized-write", "fullscreen"].includes(perm)));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => ["clipboard-sanitized-write", "fullscreen"].includes(perm));
}
function create() {
  lockPermissions();
  const s = loadState();
  win = new BrowserWindow({
    width: s.width || 1280, height: s.height || 820, x: s.x, y: s.y, minWidth: 360, minHeight: 560,
    title: "Muscle Atlas", icon: path.join(__dirname, "icon.png"), backgroundColor: "#0E1014", show: false,
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, spellcheck: false },
  });
  Menu.setApplicationMenu(null);
  if (s.max) win.maximize();
  win.once("ready-to-show", () => win.show());
  ["resize", "move", "close"].forEach((ev) => win.on(ev, () => saveState(win)));

  // links: the app stays inside; Google sign-in opens a small window; anything else goes to the normal browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (AUTH.some((r) => r.test(url)))
      return { action: "allow", overrideBrowserWindowOptions: { width: 520, height: 680, autoHideMenuBar: true, icon: path.join(__dirname, "icon.png"), title: "Entrar com Google" } };
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    try { const u = new URL(url); if (u.host === HOST || AUTH.some((r) => r.test(url))) return; } catch (x) {}
    e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url);
  });
  // F5 / Ctrl+R reload, Ctrl+Shift+I tools, F11 full screen
  win.webContents.on("before-input-event", (e, i) => {
    if (i.type !== "keyDown") return;
    if (i.key === "F5" || (i.control && i.key.toLowerCase() === "r")) { win.webContents.reload(); e.preventDefault(); }
    if (i.key === "F11") { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (i.control && i.shift && i.key.toLowerCase() === "i") { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  // no internet and nothing saved yet: show a short message instead of a blank window
  win.webContents.on("did-fail-load", (e, code, desc, url, main) => {
    if (!main || code === -3) return;
    win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(`<!doctype html><meta charset=utf-8><body style="margin:0;height:100vh;display:grid;place-items:center;background:#0E1014;color:#E8EAED;font:16px system-ui;text-align:center"><div><h2 style="margin:0 0 8px">Sem internet</h2><p style="opacity:.75;margin:0 0 18px">Na primeira vez o Muscle Atlas precisa de internet.<br>Depois ele funciona offline.</p><button onclick="location.href='${URL0}'" style="font:inherit;padding:10px 18px;border-radius:10px;border:0;background:#E8343B;color:#fff;cursor:pointer">Tentar de novo</button></div></body>`));
  });
  win.loadURL(URL0);
}

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(["clipboard-sanitized-write", "notifications", "fullscreen"].includes(perm)));
  create();
});
app.on("window-all-closed", () => app.quit());
