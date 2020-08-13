const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("noted", {
  logout: () => ipcRenderer.send("logout"),
  login: () => ipcRenderer.send("login"),
});
