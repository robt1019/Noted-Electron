const backButton = document.getElementById("backButton");

let noteId;

backButton.addEventListener("click", () => {
  window.noted.updateNote({
    id: noteId,
    title: document.forms["noteForm"]["title"].value,
    body: document.forms["noteForm"]["body"].value,
  });
  window.noted.navigateToNotes();
});

window.noted.onNote((_, note) => {
  noteId = note.id;
  document.forms["noteForm"]["title"].value = note.title;
  document.forms["noteForm"]["body"].value = note.body;
});
