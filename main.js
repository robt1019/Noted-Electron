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
const { v4: uuidv4 } = require("uuid");
const noteStorage = require("./services/note-storage.service");

const patch = (string, diff) => {
  dmp.diff_cleanupSemantic(diff);
  const patches = dmp.patch_make(string, diff);
  const patched = dmp.patch_apply(patches, string);
  return patched[0];
};

const redirectServer = express();

redirectServer.get("/logged-in", async (req, res) => {
  try {
    await auth.loadTokens(req.url);
    notes.connectToSocket(() => {
      loggedOutProcess.createWindow();
      notesProcess.destroyWindow();
    });
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
    notes.connectToSocket(() => {
      loggedOutProcess.createWindow();
      notesProcess.destroyWindow();
    });
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

notes.onInitialNotes((serverNotes) => {
  noteStorage.getNotes((err, storedNotes) => {
    if (err) {
      console.error(err);
    }
    const serverNoteIds = Object.keys(serverNotes);
    storedNotes.forEach((storedNote) => {
      console.log(`serverNoteIds: ${serverNoteIds}`);
      console.log(`stored note id: ${storedNote.id}`);
      if (!serverNoteIds.includes(storedNote.id)) {
        noteStorage.deleteNote(storedNote.id);
      }
    });
    serverNoteIds.forEach((serverNoteId) => {
      const serverNote = serverNotes[serverNoteId];
      noteStorage.getNoteById(serverNoteId, (err, storedNote) => {
        if (err) {
          console.err("failed to fetch note");
        }
        if (storedNote) {
          if (
            !(
              storedNote.title === serverNote.title &&
              storedNote.body === serverNote.body
            )
          ) {
            console.log("updating old note");
            const titleDiff = dmp.diff_main(storedNote.title, serverNote.title);
            const bodyDiff = dmp.diff_main(storedNote.body, serverNote.body);
            dmp.diff_cleanupSemantic(titleDiff);
            dmp.diff_cleanupSemantic(bodyDiff);
            const newTitle = patch(storedNote.title, titleDiff);
            const newBody = patch(storedNote.body, bodyDiff);
            noteStorage.updateNote({
              id: serverNoteId,
              title: newTitle,
              body: newBody,
            });
          }
        } else {
          console.log("creating new note");
          noteStorage.createNote({
            id: serverNoteId,
            title: serverNote.title,
            body: serverNote.body,
          });
        }
      });
    });
    setTimeout(() => {
      noteStorage.getNotes((err, notes) => {
        if (err) {
          console.err("could not fetch notes");
        }
        notesProcess.setNotes(notes);
      });
    }, 250);
  });
});

notes.onNoteCreated((newNote) => {
  console.log("incoming note creation");
  console.log(newNote);
  noteStorage.createNote(newNote);
  noteStorage.getNotes((err, notes) => {
    if (err) {
      console.err("could not fetch notes");
    }
    notesProcess.setNotes(notes);
  });
});

notes.onNoteUpdated((noteUpdate) => {
  console.log("incoming note update");
  console.log(noteUpdate);
  noteStorage.getNoteById(noteUpdate.id, (err, storedNote) => {
    if (err) {
      console.error("could not find note");
    } else {
      const newTitle = patch(storedNote.title, noteUpdate.title);
      const newBody = patch(storedNote.body, noteUpdate.body);
      noteStorage.updateNote({
        id: noteUpdate.id,
        title: newTitle,
        body: newBody,
      });
      noteStorage.getNotes((err, notes) => {
        if (err) {
          console.err("could not fetch notes");
        }
        notesProcess.setNotes(notes);
      });
    }
  });
});

notes.onNoteDeleted((noteId) => {
  console.log("incoming note deletion");
  console.log(noteId);
  noteStorage.deleteNote(noteId);
  noteStorage.getNotes((err, notes) => {
    if (err) {
      console.err("could not fetch notes");
    }
    notesProcess.setNotes(notes);
  });
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
  noteStorage.getNotes((err, notes) => {
    if (err) {
      console.err("could not fetch notes");
    }
    notesProcess.createWindow(notes);
    noteProcess.destroyWindow();
  });
});

ipcMain.on("createNote", () => {
  notes.createNote({ id: uuidv4(), title: "New...", body: "Body..." });
});

ipcMain.on("updateNote", (_, note) => {
  console.log(note);
  noteStorage.getNoteById(note.id, (err, storedNote) => {
    if (err) {
      console.error("could not fetch note");
    }
    notes.updateNote(storedNote, note);
    notesProcess.destroyWindow();
  });
});

ipcMain.on("deleteNote", (_, noteId) => {
  notes.deleteNote(noteId);
});

function openAuthWindowInBrowser() {
  shell.openExternal(auth.getAuthenticationURL());
}

async function openLogoutWindowInBrowser() {
  shell.openExternal(auth.getLogOutUrl(), { activate: false });
  await auth.logout();
}
