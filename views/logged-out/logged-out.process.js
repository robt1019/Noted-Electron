const electron = require("electron");
const notesProcess = require("../notes/notes.process");
const BrowserWindow = electron.BrowserWindow;

let loggedOutWindow = null;

const createWindow = () => {
  destroyWindow();

  loggedOutWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: `${__dirname}/../../preload.js`,
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
    },
  });

  loggedOutWindow.loadURL(`file://${__dirname}/logged-out.html`);
};

const destroyWindow = () => {
  if (loggedOutWindow) {
    loggedOutWindow.close();
    loggedOutWindow = null;
  }
};

module.exports = {
  createWindow,
  destroyWindow,
};
