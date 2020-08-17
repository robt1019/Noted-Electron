const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const offlineUpdatesPath = path.join(
  app.getPath("userData"),
  "offline-updates.json"
);

const setUpdates = (updates) => {
  console.log(`offline updates: ${updates}`);
  fs.writeFileSync(offlineUpdatesPath, JSON.stringify(updates));
};

const getUpdates = () => {
  if (fs.existsSync(offlineUpdatesPath)) {
    return require(offlineUpdatesPath);
  } else {
    setUpdates([]);
    return [];
  }
};

const createNote = (note) => {
  const updates = getUpdates();
  updates.push(["createNote", note]);
  setUpdates(updates);
};
const updateNote = (noteUpdate) => {
  const updates = getUpdates();
  updates.push(["updateNote", noteUpdate]);
  setUpdates(updates);
};
const deleteNote = (noteId) => {
  const updates = getUpdates();
  updates.push(["deleteNote", noteId]);
  setUpdates(updates);
};

const processOfflineUpdates = (socket) => {
  getUpdates().forEach((update) => {
    const action = update[0];
    const payload = update[1];
    console.log(
      `processing offline update ${action}, with payload: ${payload}`
    );
    socket.emit(action, payload);
  });
  setUpdates([]);
};

module.exports = {
  createNote,
  updateNote,
  deleteNote,
  processOfflineUpdates,
};
