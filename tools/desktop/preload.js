// Tells the page it is running inside the Windows app (hides "install" tips).
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("muscleDesktop", { app: true });
