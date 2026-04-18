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

let currentFilter = "all";

const priorityColors = { urgent: "red", high: "orange", medium: "yellow", low: "green" };
const statusColors = { new: "pink", progress: "yellow", resolved: "green" };
const statusLabels = { new: "New", progress: "In Progress", resolved: "Resolved" };

async function loadReports(filter = "all", search = "") {
  const token = await ensureToken();
  let url = `${BASE}/reports?`;
  if (filter !== "all") url += `status=${filter}&`;
  if (search) url += `search=${encodeURIComponent(search)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();

  const s = data.stats;
  const statCards = document.querySelectorAll(".stats .card h3");
  if (statCards.length >= 4) {
    statCards[0].innerText = s.new;
    statCards[1].innerText = s.progress;
    statCards[2].innerText = s.resolved;
    statCards[3].innerText = s.locations;
  }

  const list = document.getElementById("reportList");
  list.innerHTML = "";

  data.data.forEach((r) => {
    const div = document.createElement("div");
    div.className = `report ${r.status}`;
    div.innerHTML = `
      <h4>${r.reportId}
        <span class="tag ${priorityColors[r.priority]}">${r.priority}</span>
        <span class="tag ${statusColors[r.status]}">${statusLabels[r.status]}</span>
      </h4>
      <h3>${r.title}</h3>
      <p>${r.description}</p>
    `;
    list.appendChild(div);
  });
}

function filterReports(type) {
  currentFilter = type;
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  event.target.classList.add("active");
  loadReports(type, document.getElementById("searchInput").value);
}

document.getElementById("searchInput").addEventListener("keyup", function () {
  loadReports(currentFilter, this.value);
});

loadReports();
