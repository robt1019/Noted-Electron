const { app, BrowserWindow, ipcMain, shell } = require("electron");
const auth = require("./services/auth.service");
const notes = require("./services/notes.service");
const express = require("express");
const authService = require("./services/auth.service");
const { diff_match_patch } = require("diff-match-patch");
const dmp = new diff_match_patch();
const { v4: uuidv4 } = require("uuid");
const noteStorage = require("./services/note-storage.service");
const appWindow = require("./views/app.window");

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
      appWindow.navigateToLoggedOut();
    });
    res.send("Logged in to Noated :) Switch back to the app");
    appWindow.navigateToNotes();
  } catch (err) {
    appWindow.navigateToLoggedOut();
  }
});

redirectServer.get("/logged-out", async (_, res) => {
  appWindow.navigateToLoggedOut();
  res.send("logged out");
});

redirectServer.listen(5321, "127.0.0.1");

async function createWindow() {
  appWindow.createWindow();
  try {
    await authService.refreshTokens();
    notes.connectToSocket(() => {
      appWindow.navigateToLoggedOut();
    });
    appWindow.navigateToNotes();
  } catch (err) {
    appWindow.navigateToLoggedOut();
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
        appWindow.setNotes(notes);
      });
    }, 250);
  });
});

notes.onNoteCreated((newNote) => {
  noteStorage.createNote(newNote);
  noteStorage.getNotes((err, notes) => {
    if (err) {
      console.err("could not fetch notes");
    }
    notesProcess.setNotes(notes);
  });
});

notes.onNoteUpdated((noteUpdate) => {
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
        appWindow.setNotes(notes);
      });
    }
  });
});

notes.onNoteDeleted((noteId) => {
  noteStorage.deleteNote(noteId);
  noteStorage.getNotes((err, notes) => {
    if (err) {
      console.err("could not fetch notes");
    }
    appWindow.setNotes(notes);
  });
});

ipcMain.on("logout", () => {
  openLogoutWindowInBrowser();
});

ipcMain.on("login", () => {
  openAuthWindowInBrowser();
});

ipcMain.on("navigateToNote", (_, note) => {
  appWindow.navigateToNote(note);
});

ipcMain.on("navigateToNotes", () => {
  noteStorage.getNotes((err, notes) => {
    if (err) {
      console.err("could not fetch notes");
    }
    appWindow.navigateToNotes(notes);
  });
});

ipcMain.on("createNote", () => {
  notes.createNote({ id: uuidv4(), title: "New...", body: "Body..." });
});

ipcMain.on("updateNote", (_, note) => {
  noteStorage.getNoteById(note.id, (err, storedNote) => {
    if (err) {
      console.error("could not fetch note");
    }
    notes.updateNote(storedNote, note);
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
