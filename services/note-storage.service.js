const { app } = require("electron");
const path = require("path");
var sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(path.join(app.getPath("userData"), "notes"));

app.on("quit", () => {
  db.close();
});

const initialise = () => {
  db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        body TEXT NOT NULL
    )`);
  });
};

const getNotes = (done) => {
  db.serialize(() => {
    db.all(
      `
    SELECT * FROM notes
    `,
      (err, results) => done(err, results)
    );
  });
};

const getNoteById = (id, done) => {
  db.serialize(() => {
    db.get(
      `
    SELECT * FROM notes
    WHERE id="${id}"
    `,
      (err, result) => done(err, result)
    );
  });
};

const createNote = (note) => {
  db.serialize(() => {
    db.run(`
    INSERT OR REPLACE INTO notes (id, title, body)
    VALUES("${note.id}", "${note.title}", "${note.body}")
    `);
  });
};

const updateNote = (note) => {
  db.serialize(() => {
    db.run(`
        UPDATE notes
        SET title="${note.title}",
            body="${note.body}"
        WHERE id="${note.id}"
        `);
  });
};

const deleteNote = (id) => {
  db.serialize(() => {
    db.run(`
        DELETE from notes
        WHERE id="${id}"
        `);
  });
};

const deleteAll = () => {
  db.serialize(() => {
    db.run("DROP TABLE IF EXISTS notes");
  });
};

module.exports = {
  initialise,
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  deleteAll,
};
