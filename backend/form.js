function toggleDropdown(id) {
  document.querySelectorAll(".dropdown-menu").forEach(menu => {
    if (menu.id !== id) menu.style.display = "none";
  });

  const menu = document.getElementById(id);
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

/* Selection */
document.querySelectorAll(".item").forEach(item => {
  item.addEventListener("click", function () {

    const menu = this.parentElement;
    const button = menu.previousElementSibling;

    // remove active from same dropdown
    menu.querySelectorAll(".item").forEach(i => i.classList.remove("active"));

    // add active
    this.classList.add("active");

    // update text
    button.childNodes[0].nodeValue = this.innerText + " ";

    menu.style.display = "none";
  });
});

/* Close dropdown outside */
window.onclick = function(e) {
  if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown-menu").forEach(menu => {
      menu.style.display = "none";
    });
  }
}

/* Back */
function goBack() {
  window.location.href = "report.html";
}