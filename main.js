const { app, BrowserWindow, ipcMain, shell } = require("electron");
const auth = require("./services/auth.service");
const loggedOutProcess = require("./views/logged-out/logged-out.process");
const notesProcess = require("./views/notes/notes.process");
const express = require("express");
const authService = require("./services/auth.service");
const noteProcess = require("./views/note/note.process");

const redirectServer = express();

redirectServer.get("/logged-in", async (req, res) => {
  try {
    await auth.loadTokens(req.url);
    notesProcess.createWindow();
    loggedOutProcess.destroyWindow();
    res.send("logged in");
  } catch (err) {
    console.log(err);
    loggedOutProcess.createWindow();
    notesProcess.destroyWindow();
  }
});

redirectServer.get("/logged-out", async (_, res) => {
  loggedOutProcess.createWindow();
  notesProcess.destroyWindow();
  res.send("logged out");
});

redirectServer.listen(5321, "127.0.0.1");

async function createWindow() {
  try {
    await authService.refreshTokens();
    notesProcess.createWindow();
    loggedOutProcess.destroyWindow();
  } catch (err) {
    console.log(err);
    loggedOutProcess.createWindow();
    notesProcess.destroyWindow();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("logout", () => {
  openLogoutWindowInBrowser();
});

ipcMain.on("login", () => {
  openAuthWindowInBrowser();
});

function openAuthWindowInBrowser() {
  shell.openExternal(auth.getAuthenticationURL());
}

async function openLogoutWindowInBrowser() {
  shell.openExternal(auth.getLogOutUrl(), { activate: false });
  await auth.logout();
}
