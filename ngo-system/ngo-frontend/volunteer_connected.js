const BASE = "https://ngorescue.onrender.com/api";

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

async function loadVolunteers(search = "") {
  const token = await ensureToken();
  let url = `${BASE}/volunteers?`;
  if (search) url += `search=${encodeURIComponent(search)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();

  document.getElementById("total").innerText = data.stats.total;
  document.getElementById("available").innerText = data.stats.available;

  const grid = document.getElementById("volunteerGrid");
  grid.innerHTML = "";

  data.data.forEach((v) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="top">
        <div class="left">
          <div class="avatar">${v.avatar || v.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <div class="name">${v.name}</div>
            <div class="distance">📍 ${v.distance || v.location}</div>
            <div class="rating">⭐ ${v.rating}</div>
          </div>
        </div>
        <div class="score">${v.matchScore}%</div>
      </div>
      <div class="tags">
        ${v.skills.map((s) => `<span class="tag">${s}</span>`).join("")}
      </div>
      <div class="actions">
        <button class="map-btn">📍 View Map</button>
        <button class="match-btn" onclick="toggleStatus('${v._id}', this)">
          ${v.status === "available" ? "Online" : "Offline"}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function toggleStatus(id, btn) {
  const token = await ensureToken();
  const res = await fetch(`${BASE}/volunteers/${id}/toggle-status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.success) { btn.innerText = data.data.status === "available" ? "Online" : "Offline"; loadVolunteers(); }
}

document.querySelector(".search-volunteers input").addEventListener("keyup", function () {
  loadVolunteers(this.value);
});

loadVolunteers();
