const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("noted", {
  logout: () => ipcRenderer.send("logout"),
  login: () => ipcRenderer.send("login"),
  navigateToNote: (note) => ipcRenderer.send("navigateToNote", note),
  navigateToNotes: () => ipcRenderer.send("navigateToNotes"),
  onNotes: (callback) => ipcRenderer.on("notes", callback),
  onNote: (callback) => ipcRenderer.on("note", callback),
  createNote: () => ipcRenderer.send("createNote"),
  updateNote: (updatedNote) => ipcRenderer.send("updateNote", updatedNote),
  deleteNote: (noteId) => ipcRenderer.send("deleteNote", noteId),
});
