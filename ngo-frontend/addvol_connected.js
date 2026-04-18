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

function closeModal() {
  window.history.back();
}

async function addVolunteer() {
  const name = document.getElementById("vol-name").value.trim();
  const email = document.getElementById("vol-email").value.trim();
  const phone = document.getElementById("vol-phone").value.trim();
  const location = document.getElementById("vol-location").value.trim();
  const qualification = document.getElementById("vol-qualification").value.trim();

  if (!name || !email || !phone) { alert("Name, email and phone are required."); return; }

  const token = await ensureToken();
  const res = await fetch(`${BASE}/volunteers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, email, phone, location, qualification }),
  });
  const data = await res.json();
  if (data.success) { alert("Volunteer added successfully!"); window.history.back(); }
  else alert("Error: " + data.message);
}
