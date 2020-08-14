const logoutButton = document.getElementById("logoutButton");
const addNoteButton = document.getElementById("addNoteButton");
const notesList = document.getElementById("notesList");

logoutButton.addEventListener("click", () => {
  window.noted.logout();
});

addNoteButton.addEventListener("click", () => {
  window.noted.createNote();
});

window.noted.onNotes((_, notes) => {
  notesList.innerHTML = "";
  let noteNodes = [];
  notes.forEach((note) => {
    console.log(note);
    const li = document.createElement("li");
    const titleSpan = document.createElement("span");
    titleSpan.innerText = note.title;
    titleSpan.addEventListener("click", () => {
      window.noted.navigateToNote(note);
    });
    li.appendChild(titleSpan);
    const deleteButton = document.createElement("button");
    deleteButton.innerText = "delete";
    deleteButton.addEventListener("click", () => {
      window.noted.deleteNote(note.id);
    });
    li.append(deleteButton);
    noteNodes.push(li);
  });
  noteNodes = noteNodes.sort((note1, note2) => {
    if (note1.innerText.toLowerCase() < note2.innerText.toLowerCase()) {
      return -1;
    } else {
      return 1;
    }
  });
  noteNodes.forEach((node) => notesList.appendChild(node));
});
