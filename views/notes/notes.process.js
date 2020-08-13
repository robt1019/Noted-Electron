const electron = require("electron");

const BrowserWindow = electron.BrowserWindow;

let notesWindow = null;

const createWindow = (inMemoryNotes) => {
  destroyWindow();

  notesWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: `${__dirname}/../../preload.js`,
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
    },
  });

  notesWindow.loadURL(`file://${__dirname}/notes.html`).then(() => {
    if (inMemoryNotes) {
      notesWindow.webContents.send("notes", inMemoryNotes);
    }
  });
};

const destroyWindow = () => {
  if (notesWindow) {
    notesWindow.close();
    notesWindow = null;
  }
};

const setNotes = (notes) => {
  if (notesWindow) {
    notesWindow.webContents.send("notes", notes);
  }
};

module.exports = {
  createWindow,
  destroyWindow,
  setNotes,
};
