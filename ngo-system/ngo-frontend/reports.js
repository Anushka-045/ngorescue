function filterReports(type) {
  const reports = document.querySelectorAll(".report");
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");

  reports.forEach(report => {
    if (type === "all") {
      report.style.display = "block";
    } else {
      report.style.display = report.classList.contains(type)
        ? "block"
        : "none";
    }
  });
}

/* SEARCH */
document.getElementById("searchInput").addEventListener("keyup", function () {
  let value = this.value.toLowerCase();
  let reports = document.querySelectorAll(".report");

  reports.forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(value)
      ? "block"
      : "none";
  });
});