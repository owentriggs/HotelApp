const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
  console.log("app ready, creating window...");
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL("about:blank");
  console.log("window created, load requested");
  win.webContents.on("did-finish-load", () => console.log("did-finish-load"));
  win.webContents.on("render-process-gone", (_e, details) =>
    console.log("render-process-gone", details)
  );
});

app.on("render-process-gone", (_e, _wc, details) => console.log("app render-process-gone", details));
process.on("uncaughtException", (err) => console.log("uncaughtException", err));
