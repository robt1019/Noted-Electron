const io = require("socket.io-client");
const { apiIdentifier } = require("../env-variables.json");
const auth = require("../services/auth.service");
const { diff_match_patch } = require("diff-match-patch");
const dmp = new diff_match_patch();
const offlineUpdates = require("./offline-updates.service");
const noteStorage = require("./note-storage.service");
const networkDetector = require("./network-detector.service");
const appWindow = require("../views/app.window");

let socket;

let _onNoteCreated;
let _onNoteUpdated;
let _onInitialNotes;
let _onNoteDeleted;

const onNoteCreated = (cb) => {
  _onNoteCreated = cb;
};

const onNoteUpdated = (cb) => {
  _onNoteUpdated = cb;
};

const onInitialNotes = (cb) => {
  _onInitialNotes = cb;
};

const onNoteDeleted = (cb) => {
  _onNoteDeleted = cb;
};

const createNote = (note) => {
  let serverGotTheMessage = false;
  setTimeout(() => {
    if (!serverGotTheMessage) {
      noteStorage.createNote(note);
      offlineUpdates.createNote(note);
      noteStorage.getNotes((err, notes) => {
        if (err) {
          console.error("could not fetch notes");
        }
        appWindow.setNotes(notes);
      });
    }
  }, 1000);
  socket.emit("createNote", note, () => {
    serverGotTheMessage = true;
  });
};

const updateNote = (prevNote, updatedNote) => {
  let serverGotTheMessage = false;
  const titleDiff = dmp.diff_main(prevNote.title, updatedNote.title);
  const bodyDiff = dmp.diff_main(prevNote.body, updatedNote.body);
  dmp.diff_cleanupSemantic(titleDiff);
  dmp.diff_cleanupSemantic(bodyDiff);
  const noteUpdate = {
    id: updatedNote.id,
    title: titleDiff,
    body: bodyDiff,
  };
  setTimeout(() => {
    if (!serverGotTheMessage) {
      noteStorage.updateNote(updatedNote);
      offlineUpdates.updateNote(noteUpdate);
      noteStorage.getNotes((err, notes) => {
        if (err) {
          console.error("could not fetch notes");
        }
        appWindow.setNotes(notes);
      });
    }
  }, 1000);
  socket.emit("updateNote", noteUpdate, () => {
    serverGotTheMessage = true;
  });
};

const deleteNote = (noteId) => {
  let serverGotTheMessage = false;
  setTimeout(() => {
    if (!serverGotTheMessage) {
      noteStorage.deleteNote(noteId);
      offlineUpdates.deleteNote(noteId);
      noteStorage.getNotes((err, notes) => {
        if (err) {
          console.error("could not fetch notes");
        }
        appWindow.setNotes(notes);
      });
    }
  }, 1000);
  socket.emit("deleteNote", noteId, () => {
    serverGotTheMessage = true;
  });
};

const connectToSocket = (onLoggedOut) => {
  socket = io(apiIdentifier);

  socket.on("connect", () => {
    const token = auth.getAccessToken();
    socket.emit("authenticate", { token });
  });

  socket.on("noteCreated", (newNote) => {
    _onNoteCreated(newNote);
  });

  socket.on("noteUpdated", (noteUpdate) => {
    _onNoteUpdated(noteUpdate);
  });

  socket.on("noteDeleted", (noteId) => {
    _onNoteDeleted(noteId);
  });

  socket.on("authenticated", () => {
    offlineUpdates.processOfflineUpdates(socket, () => {
      socket.emit("getInitialNotes");
    });
    socket.once("initialNotes", (data) => {
      if (data) {
        _onInitialNotes(JSON.parse(data));
      }
    });
  });

  socket.on("unauthorized", async () => {
    try {
      await auth.refreshTokens();
      socket.connect();
    } catch (err) {
      console.error(err);
      auth.logout();
      onLoggedOut();
    }
  });

  socket.on("disconnect", async () => {
    try {
      await auth.refreshTokens();
      socket.connect();
    } catch (err) {
      console.error(err);
      auth.logout();
      onLoggedOut();
    }
  });

  networkDetector.onNetworkChange((isOnline) => {
    if (isOnline) {
      socket.connect();
    }
  });
};

module.exports = {
  connectToSocket,
  onNoteCreated,
  onNoteUpdated,
  onNoteDeleted,
  onInitialNotes,
  createNote,
  updateNote,
  deleteNote,
};
