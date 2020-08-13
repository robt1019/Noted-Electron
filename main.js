const { app, BrowserWindow, ipcMain, shell } = require("electron");
const auth = require("./services/auth.service");
const loggedOutProcess = require("./views/logged-out/logged-out.process");
const notesProcess = require("./views/notes/notes.process");
const notes = require("./services/notes.service");
const express = require("express");
const authService = require("./services/auth.service");
const noteProcess = require("./views/note/note.process");
const { diff_match_patch } = require("diff-match-patch");
const dmp = new diff_match_patch();

const patch = (string, diff) => {
  dmp.diff_cleanupSemantic(diff);
  const patches = dmp.patch_make(string, diff);
  const patched = dmp.patch_apply(patches, string);
  return patched[0];
};

let inMemoryNotes;

const redirectServer = express();

redirectServer.get("/logged-in", async (req, res) => {
  try {
    await auth.loadTokens(req.url);
    notes.connectToNotesStream();
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
    notes.connectToNotesStream();
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

notes.onInitialNotes((notes) => {
  inMemoryNotes = notes;
  notesProcess.setNotes(inMemoryNotes);
});

notes.onNoteCreated((newNote) => {
  console.log("incoming note creation");
  console.log(newNote);
  inMemoryNotes[newNote.id] = {
    title: newNote.title,
    body: newNote.body,
  };
  notesProcess.setNotes(inMemoryNotes);
});

notes.onNoteUpdated((noteUpdate) => {
  console.log("incoming note update");
  console.log(noteUpdate);
  const noteToUpdate = inMemoryNotes[noteUpdate.id];
  const newTitle = patch(noteToUpdate.title, noteUpdate.title);
  const newBody = patch(noteToUpdate.body, noteUpdate.body);
  inMemoryNotes[noteUpdate.id] = {
    title: newTitle,
    body: newBody,
  };
  notesProcess.setNotes(inMemoryNotes);
});

notes.onNoteDeleted((noteId) => {
  console.log("incoming note deletion");
  console.log(noteId);
  delete inMemoryNotes[noteId];
  notesProcess.setNotes(inMemoryNotes);
});

ipcMain.on("logout", () => {
  openLogoutWindowInBrowser();
});

ipcMain.on("login", () => {
  openAuthWindowInBrowser();
});

ipcMain.on("navigateToNote", (_, note) => {
  noteProcess.createWindow(note);
  notesProcess.destroyWindow();
});

ipcMain.on("navigateToNotes", () => {
  notesProcess.createWindow(inMemoryNotes);
  noteProcess.destroyWindow();
});

ipcMain.on("updateNote", (_, note) => {
  console.log(note);
  const prevNote = inMemoryNotes[note.id];
  notes.updateNote(prevNote, note);
  notesProcess.destroyWindow();
});

function openAuthWindowInBrowser() {
  shell.openExternal(auth.getAuthenticationURL());
}

async function openLogoutWindowInBrowser() {
  shell.openExternal(auth.getLogOutUrl(), { activate: false });
  await auth.logout();
}
