let noteWindow = null;

const createWindow = () => {
  destroyWindow();

  noteWindow = new BrowserWindow({
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

  noteWindow.loadURL(`file://${__dirname}/note.html`);
};

const destroyWindow = () => {
  if (noteWindow) {
    noteWindow.close();
    noteWindow = null;
  }
};

module.exports = {
  createWindow,
  destroyWindow,
};
