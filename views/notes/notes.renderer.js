const mockNotes = [
  { title: "Note 1", body: "super sweet note with details", id: "id1" },
];
const logoutButton = document.getElementById("logoutButton");
const notesList = document.getElementById("notesList");

logoutButton.addEventListener("click", () => {
  window.noted.logout();
});

mockNotes.forEach((note) => {
  const li = document.createElement("li");
  const text = document.createTextNode(note.title);
  li.appendChild(text);
  li.addEventListener("click", () => {
    window.noted.navigateToNote(note);
  });
  notesList.appendChild(li);
});
