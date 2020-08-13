const note = document.getElementById("note");
const backButton = document.getElementById("backButton");

backButton.addEventListener("click", () => {
  window.noted.navigateToNotes();
});
