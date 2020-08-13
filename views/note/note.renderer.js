const note = document.getElementById("note");
const backButton = document.getElementById("backButton");

backButton.addEventListener("click", () => {
  window.noted.navigateToNotes();
});

window.noted.onNote((_, note) => {
  console.log(note);
  document.forms["noteForm"]["title"].value = note.title;
  document.forms["noteForm"]["body"].value = note.body;
});
