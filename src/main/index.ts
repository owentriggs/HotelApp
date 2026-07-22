import { app, BrowserWindow } from "electron";
import path from "path";
import { initDb } from "../db";
import { registerIpcHandlers } from "./ipcHandlers";

// Chromium's OS-level sandbox (distinct from webPreferences.sandbox, which only affects
// the renderer) causes an immediate SIGSEGV on some older macOS setups (observed on
// High Sierra 10.13) when the app isn't code-signed with the right entitlements. This app
// never loads untrusted remote content — only our own bundled files — so disabling the
// full OS sandbox is an acceptable tradeoff to avoid that crash. Must be set before 'ready'.
app.commandLine.appendSwitch("no-sandbox");

// Chromium's GPU process (Metal/ANGLE backend) is a separate common SIGSEGV source on old
// Macs whose GPU drivers predate what this Chromium version expects. This app is a simple
// CRUD/forms UI with no need for GPU-accelerated rendering, so falling back to software
// rendering entirely avoids that crash path.
app.disableHardwareAcceleration();

// Only use the Vite dev server when explicitly requested (see npm script "dev:electron").
// Previously this was `!app.isPackaged`, which is true for any unpacked run (including
// `npm start`), forcing every non-installer run to depend on a live dev server at
// localhost:5173 even when it wasn't running.
const isDev = process.env.HOTELAPP_DEV_SERVER === "1";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: "HotelApp",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  initDb();
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
