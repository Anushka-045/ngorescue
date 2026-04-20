const BASE = "http://localhost:5000/api";

async function ensureToken() {
  let token = localStorage.getItem("ngo_token");
  if (token) return token;
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ngorescue.com", password: "admin123" }),
  });
  const data = await res.json();
  if (data.token) { localStorage.setItem("ngo_token", data.token); return data.token; }
  return null;
}

function toggleDropdown(id) {
  document.querySelectorAll(".dropdown-menu").forEach((menu) => {
    if (menu.id !== id) menu.style.display = "none";
  });
  const menu = document.getElementById(id);
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

document.querySelectorAll(".item").forEach((item) => {
  item.addEventListener("click", function () {
    const menu = this.parentElement;
    const button = menu.previousElementSibling;
    menu.querySelectorAll(".item").forEach((i) => i.classList.remove("active"));
    this.classList.add("active");
    button.childNodes[0].nodeValue = this.innerText + " ";
    menu.style.display = "none";
  });
});

window.onclick = function (e) {
  if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown-menu").forEach((menu) => { menu.style.display = "none"; });
  }
};

function goBack() { window.location.href = "Report.html"; }

document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const title       = document.getElementById("report-title").value.trim();
  const location    = document.getElementById("report-location").value.trim();
  const description = document.getElementById("report-description").value.trim();
  const reportedBy  = document.getElementById("report-by").value.trim();

  if (!title) { alert("Title is required."); return; }

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.textContent = "⚡ AI is analyzing...";
  submitBtn.disabled = true;

  const token = await ensureToken();

  const res = await fetch(`${BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, location, description, reportedBy }),
  });

  const data = await res.json();

  if (data.success) {
    const ai = data.ai;
    const resultBox = document.getElementById("aiResult");
    document.getElementById("ai-priority").innerHTML  = `<b>Priority:</b> ${ai.priority}`;
    document.getElementById("ai-category").innerHTML  = `<b>Category:</b> ${ai.category}`;
    document.getElementById("ai-volunteer").innerHTML = `<b>Assigned To:</b> ${ai.assignedVolunteer || "No volunteer available"}`;
    document.getElementById("ai-reason").textContent  = ai.reason ? `Reason: ${ai.reason}` : "";
    resultBox.style.display = "block";

    submitBtn.textContent = "✅ Submitted!";
    setTimeout(() => { window.location.href = "Report.html"; }, 2500);
  } else {
    alert("Error: " + data.message);
    submitBtn.textContent = "Submit Report";
    submitBtn.disabled = false;
  }
});
