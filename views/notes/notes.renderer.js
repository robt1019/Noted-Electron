const logoutButton = document.getElementById("logoutButton");
const notesList = document.getElementById("notesList");

logoutButton.addEventListener("click", () => {
  window.noted.logout();
});

window.noted.onNotes((_, notes) => {
  notesList.innerHTML = "";
  let noteNodes = [];
  Object.keys(notes).forEach((noteId) => {
    const note = notes[noteId];
    console.log(note);
    const li = document.createElement("li");
    const text = document.createTextNode(note.title);
    li.appendChild(text);
    li.addEventListener("click", () => {
      window.noted.navigateToNote(note);
    });
    noteNodes.push(li);
  });
  console.log(noteNodes);
  noteNodes = noteNodes.sort((note1, note2) => {
    if (note1.innerText.toLowerCase() < note2.innerText.toLowerCase()) {
      return -1;
    } else {
      return 1;
    }
  });
  console.log(noteNodes);
  noteNodes.forEach((node) => notesList.appendChild(node));
});
