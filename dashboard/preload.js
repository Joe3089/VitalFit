const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  navBack: () => ipcRenderer.send("nav-back"),
  navForward: () => ipcRenderer.send("nav-forward"),
});
