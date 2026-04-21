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

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  if (input.value.trim() === "") return;

  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.innerText = input.value;
  chatBox.appendChild(userMsg);

  const userText = input.value;
  input.value = "";

  const botMsg = document.createElement("div");
  botMsg.className = "message bot";
  botMsg.innerText = "Thinking...";
  chatBox.appendChild(botMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  const token = await ensureToken();
  const res = await fetch(`${BASE}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: userText }),
  });
  const data = await res.json();
  botMsg.innerText = data.success ? data.reply : "Sorry, something went wrong.";
  chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("userInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") sendMessage();
});
