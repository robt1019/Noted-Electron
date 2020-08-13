const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("noted", {
  logout: () => ipcRenderer.send("logout"),
  login: () => ipcRenderer.send("login"),
  navigateToNote: (note) => ipcRenderer.send("navigateToNote", note),
  navigateToNotes: () => ipcRenderer.send("navigateToNotes"),
});
