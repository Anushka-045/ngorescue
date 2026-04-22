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

async function loadActions(type = "all", search = "") {
  const token = await ensureToken();
  let url = `${BASE}/actions?`;
  if (type !== "all") url += `type=${type}&`;
  if (search) url += `search=${encodeURIComponent(search)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();

  document.getElementById("urgentCount").innerText = data.stats.urgent;
  document.getElementById("highCount").innerText   = data.stats.high;
  document.getElementById("mediumCount").innerText = data.stats.medium;
  document.getElementById("totalCount").innerText  = data.stats.total;

  const container = document.getElementById("cards");
  container.innerHTML = "";

  data.data.forEach((action) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.type = action.type;
    card.innerHTML = `
      <span class="tag ${action.type}">${action.type.charAt(0).toUpperCase() + action.type.slice(1)}</span>
      <p class="hi">${action.title}</p>
      <p class="time">${timeAgo(action.createdAt)}</p>
      ${action.assignedTo
        ? `<button class="assign-btn assigned" onclick="openAssign('${action._id}')">✓ Assigned — Reassign?</button>`
        : `<button class="assign-btn" onclick="openAssign('${action._id}')">⚡ AI Assign</button>`
      }
      <div class="progress">
        <div class="progress-bar" style="width:${action.progress}%"></div>
      </div>
    `;
    container.appendChild(card);
  });
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`;
  return `${Math.floor(diff / 1440)} days ago`;
}

async function openAssign(actionId) {
  const token = await ensureToken();

  showPopup("⚡ AI is finding the best volunteer...", null, null, true);

  const res = await fetch(`${BASE}/actions/${actionId}/suggest-volunteer`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!data.success) {
    closePopup();
    alert(data.message || "Could not get AI suggestion.");
    return;
  }

  const { volunteerId: _id, volunteerName: name, reason } = data;

  showPopup(`⚡ AI Suggestion`, name, reason, false, async () => {
    const assignRes = await fetch(`${BASE}/actions/${actionId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ volunteerId: _id }),
    });
    const assignData = await assignRes.json();
    closePopup();
    if (assignData.success) { loadActions(); }
    else alert("Error: " + assignData.message);
  });
}

function showPopup(title, volunteerName, reason, loading, onConfirm) {
  document.getElementById("ai-popup")?.remove();

  const popup = document.createElement("div");
  popup.id = "ai-popup";
  popup.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:9999;
  `;

  popup.innerHTML = loading ? `
    <div style="background:#fff; border-radius:14px; padding:30px 36px; text-align:center; width:340px; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
      <div style="font-size:28px; margin-bottom:12px;">⚡</div>
      <p style="font-size:15px; color:#1e293b; font-weight:600;">${title}</p>
      <p style="font-size:13px; color:#64748b; margin-top:6px;">Analyzing action and volunteer skills...</p>
    </div>
  ` : `
    <div style="background:#fff; border-radius:14px; padding:28px 32px; width:380px; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
      <p style="font-size:16px; font-weight:700; color:#1e293b; margin-bottom:16px;">${title}</p>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px; margin-bottom:16px;">
        <p style="font-size:14px; color:#166534; font-weight:600; margin-bottom:6px;">👤 ${volunteerName}</p>
        <p style="font-size:12px; color:#15803d;">${reason}</p>
      </div>
      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button onclick="closePopup()" style="padding:9px 18px; border-radius:8px; border:1px solid #e2e8f0; background:#f1f5f9; cursor:pointer; font-size:13px;">Cancel</button>
        <button id="confirmBtn" style="padding:9px 18px; border-radius:8px; border:none; background:#14b8a6; color:white; cursor:pointer; font-size:13px; font-weight:600;">✓ Confirm Assign</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  if (!loading && onConfirm) {
    document.getElementById("confirmBtn").addEventListener("click", onConfirm);
  }
}

function closePopup() {
  document.getElementById("ai-popup")?.remove();
}

function filterCards(type) {
  document.querySelectorAll(".filters button").forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
  loadActions(type, document.getElementById("searchInput").value);
}

document.getElementById("searchInput").addEventListener("keyup", function () {
  loadActions("all", this.value);
});

loadActions();