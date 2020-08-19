const electron = require("electron");

const BrowserWindow = electron.BrowserWindow;

let window = null;

const createWindow = () => {
  destroyWindow();

  window = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: `${__dirname}/../preload.js`,
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
    },
  });
};

const destroyWindow = () => {
  if (window) {
    window.close();
    window = null;
  }
};

const navigateToNotes = (storedNotes) => {
  window.loadURL(`file://${__dirname}/notes/notes.html`).then(() => {
    if (storedNotes) {
      window.webContents.send("notes", storedNotes);
    }
  });
};

const navigateToNote = (note) => {
  window.loadURL(`file://${__dirname}/note/note.html`).then(() => {
    window.webContents.send("note", note);
  });
};

const navigateToLoggedOut = () => {
  window
    .loadURL(`file://${__dirname}/logged-out/logged-out.html`)
    .then(() => {});
};

const setNotes = (notes) => {
  if (window) {
    window.webContents.send("notes", notes);
  }
};

module.exports = {
  createWindow,
  setNotes,
  navigateToNotes,
  navigateToNote,
  navigateToLoggedOut,
};
