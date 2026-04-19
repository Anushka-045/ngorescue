const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const TOKEN = "ngo-token-xyz-2024";
const DATA_FILE = path.join(__dirname, "data.json");

const DEFAULT_DATA = {
  volunteers: [
    { _id: "v1", name: "Ayesha Khan",  email: "ayesha@ngo.com",  phone: "+91 9876543201", location: "North Camp",  qualification: "MBBS",   status: "available", rating: 4.8, matchScore: 92, skills: ["Medical","First Aid"],   avatar: "AK" },
    { _id: "v2", name: "Rahul Sharma", email: "rahul@ngo.com",   phone: "+91 9876543202", location: "Sector 7",    qualification: "B.Tech", status: "available", rating: 4.6, matchScore: 85, skills: ["Logistics","Tech"],       avatar: "RS" },
    { _id: "v3", name: "Priya Mehta",  email: "priya@ngo.com",   phone: "+91 9876543203", location: "East Zone",   qualification: "MSW",    status: "offline",   rating: 4.9, matchScore: 95, skills: ["Counselling","Admin"],    avatar: "PM" },
    { _id: "v4", name: "Arjun Das",    email: "arjun@ngo.com",   phone: "+91 9876543204", location: "West Camp",   qualification: "BBA",    status: "available", rating: 4.5, matchScore: 78, skills: ["Food","Shelter"],         avatar: "AD" },
    { _id: "v5", name: "Sneha Roy",    email: "sneha@ngo.com",   phone: "+91 9876543205", location: "South Block", qualification: "MBBS",   status: "available", rating: 4.7, matchScore: 88, skills: ["Medical","Nutrition"],    avatar: "SR" },
    { _id: "v6", name: "Karan Verma",  email: "karan@ngo.com",   phone: "+91 9876543206", location: "Central Hub", qualification: "MBA",    status: "offline",   rating: 4.4, matchScore: 72, skills: ["Admin","Logistics"],      avatar: "KV" },
    { _id: "v7", name: "Meena Joshi",  email: "meena@ngo.com",   phone: "+91 9876543207", location: "East Zone",   qualification: "BEd",    status: "available", rating: 4.3, matchScore: 70, skills: ["Education","Admin"],      avatar: "MJ" },
    { _id: "v8", name: "Dev Patel",    email: "dev@ngo.com",     phone: "+91 9876543208", location: "North Camp",  qualification: "B.Tech", status: "available", rating: 4.6, matchScore: 80, skills: ["Tech","Shelter"],         avatar: "DP" },
  ],
  reports: [
    { _id: "r1", reportId: "RPT-001", title: "Water shortage in Block C",       description: "Severe water shortage affecting 200 families in Block C since 2 days.",      location: "Block C, North Camp", category: "Water & Sanitation", priority: "urgent", status: "new",      reportedBy: "Field Officer Raj",    createdAt: new Date(Date.now() - 3600000).toISOString()  },
    { _id: "r2", reportId: "RPT-002", title: "Medical supplies running low",    description: "First aid kits and antibiotics nearly exhausted at the east zone clinic.",    location: "East Zone Clinic",    category: "Healthcare",          priority: "high",   status: "progress", reportedBy: "Dr. Meena",            createdAt: new Date(Date.now() - 7200000).toISOString()  },
    { _id: "r3", reportId: "RPT-003", title: "Shelter roof damage after storm", description: "Storm last night damaged roofing for 15 temporary shelters in Sector 4.",    location: "Sector 4",            category: "Shelter",             priority: "urgent", status: "new",      reportedBy: "Camp Manager Ali",     createdAt: new Date(Date.now() - 1800000).toISOString()  },
    { _id: "r4", reportId: "RPT-004", title: "Food distribution delayed",       description: "Truck breakdown causing delay in afternoon food distribution for west camp.", location: "West Camp",           category: "Food & Nutrition",    priority: "medium", status: "progress", reportedBy: "Logistics Head Priya", createdAt: new Date(Date.now() - 10800000).toISOString() },
    { _id: "r5", reportId: "RPT-005", title: "Sanitation unit repaired",        description: "Mobile sanitation unit in south block has been fixed and is operational.",    location: "South Block",         category: "Water & Sanitation",  priority: "low",    status: "resolved", reportedBy: "Tech Team",            createdAt: new Date(Date.now() - 86400000).toISOString() },
  ],
  actions: [
    { _id: "a1", title: "Deploy medical team to Block C immediately", type: "urgent", progress: 20, assignedTo: null, createdAt: new Date(Date.now() - 1800000).toISOString()  },
    { _id: "a2", title: "Deliver water tanker to North Camp",         type: "urgent", progress: 45, assignedTo: null, createdAt: new Date(Date.now() - 3600000).toISOString()  },
    { _id: "a3", title: "Repair shelter roofs in Sector 4",           type: "high",   progress: 10, assignedTo: null, createdAt: new Date(Date.now() - 7200000).toISOString()  },
    { _id: "a4", title: "Restock antibiotics at East Zone Clinic",    type: "high",   progress: 60, assignedTo: "v1", createdAt: new Date(Date.now() - 5400000).toISOString()  },
    { _id: "a5", title: "Resume food distribution in West Camp",      type: "medium", progress: 75, assignedTo: "v2", createdAt: new Date(Date.now() - 10800000).toISOString() },
    { _id: "a6", title: "Conduct headcount in Central Hub",           type: "medium", progress: 30, assignedTo: null, createdAt: new Date(Date.now() - 14400000).toISOString() },
    { _id: "a7", title: "Update supply inventory records",            type: "medium", progress: 50, assignedTo: "v3", createdAt: new Date(Date.now() - 21600000).toISOString() },
  ],
  reportCounter: 6,
  actionCounter: 8,
};

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ volunteers, reports, actions, reportCounter, actionCounter }, null, 2));
}

let { volunteers, reports, actions, reportCounter, actionCounter } = loadData();

const ADMIN = { email: "admin@ngorescue.com", password: "admin123", role: "admin" };
const VOLUNTEER_CREDS = { email: "volunteer@ngorescue.com", password: "vol123", role: "volunteer" };

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ") || header.split(" ")[1] !== TOKEN) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
}

async function callAI(prompt, systemPrompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5000",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-lite-001",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
    }),
  });
  const data = await response.json();
  // console.log("OpenRouter response:", JSON.stringify(data, null, 2)); 
  return data.choices?.[0]?.message?.content?.trim() || null;
}

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });
  if ((email === ADMIN.email && password === ADMIN.password) || (email === VOLUNTEER_CREDS.email && password === VOLUNTEER_CREDS.password)) {
    const role = email === ADMIN.email ? "admin" : "volunteer";
    return res.json({ success: true, token: TOKEN, role, name: role === "admin" ? "Admin" : "Volunteer" });
  }
  res.status(401).json({ success: false, message: "Invalid credentials" });
});

app.get("/api/volunteers", auth, (req, res) => {
  const { search } = req.query;
  let list = [...volunteers];
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(v => v.name.toLowerCase().includes(s) || v.skills.some(sk => sk.toLowerCase().includes(s)) || v.location.toLowerCase().includes(s));
  }
  const available = list.filter(v => v.status === "available").length;
  res.json({ success: true, stats: { total: list.length, available }, data: list });
});

app.post("/api/volunteers", auth, (req, res) => {
  const { name, email, phone, location, qualification, skills } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ success: false, message: "Name, email and phone are required" });
  if (volunteers.find(v => v.email === email)) return res.status(409).json({ success: false, message: "Email already exists" });
  const newVol = {
    _id: "v" + Date.now(),
    name, email, phone,
    location: location || "Unknown",
    qualification: qualification || "N/A",
    status: "available",
    rating: 4.0,
    matchScore: 70,
    skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map(s => s.trim()) : []),
    avatar: name.slice(0, 2).toUpperCase(),
  };
  volunteers.push(newVol);
  saveData();
  res.json({ success: true, data: newVol });
});

app.patch("/api/volunteers/:id/toggle-status", auth, (req, res) => {
  const vol = volunteers.find(v => v._id === req.params.id);
  if (!vol) return res.status(404).json({ success: false, message: "Volunteer not found" });
  vol.status = vol.status === "available" ? "offline" : "available";
  saveData();
  res.json({ success: true, data: vol });
});

app.get("/api/reports", auth, (req, res) => {
  const { status, search } = req.query;
  let list = [...reports];
  if (status && status !== "all") list = list.filter(r => r.status === status);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(r => r.title.toLowerCase().includes(s) || r.description.toLowerCase().includes(s) || r.location.toLowerCase().includes(s));
  }
  const locs = new Set(reports.map(r => r.location)).size;
  res.json({
    success: true,
    stats: {
      new: reports.filter(r => r.status === "new").length,
      progress: reports.filter(r => r.status === "progress").length,
      resolved: reports.filter(r => r.status === "resolved").length,
      locations: locs,
    },
    data: list,
  });
});

app.post("/api/reports", auth, async (req, res) => {
  const { title, description, location, reportedBy } = req.body;
  if (!title) return res.status(400).json({ success: false, message: "Title is required" });

  let priority = "medium";
  let category = "Other";
  let assignedVolunteer = null;
  let aiReason = "Auto-assigned based on availability";

  try {
    const availableVols = volunteers.filter(v => v.status === "available");
    const volList = availableVols.map(v => `${v._id}: ${v.name} (Skills: ${v.skills.join(", ")}, Location: ${v.location})`).join("\n");

    const aiResponse = await callAI(
      `Report Title: ${title}\nDescription: ${description || ""}\nLocation: ${location || "Unknown"}`,
      `You are an AI for an NGO disaster relief system. Analyze this report and respond ONLY with valid JSON, no extra text:
{
  "priority": "urgent|high|medium|low",
  "category": "Healthcare|Water & Sanitation|Food & Nutrition|Shelter|Logistics|Other",
  "assignVolunteerId": "<_id from list or null>",
  "reason": "<one sentence>"
}
Available volunteers:
${volList}`
    );

    if (aiResponse) {
      const cleaned = aiResponse.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      priority = parsed.priority || priority;
      category = parsed.category || category;
      aiReason = parsed.reason || aiReason;
      if (parsed.assignVolunteerId) {
        assignedVolunteer = volunteers.find(v => v._id === parsed.assignVolunteerId) || null;
      }
    }
  } catch (e) {
    console.error("AI report processing error:", e.message);
  }

  const id = "r" + reportCounter++;
  const newReport = {
    _id: id,
    reportId: "RPT-" + String(reportCounter - 1).padStart(3, "0"),
    title,
    description: description || "",
    location: location || "Unknown",
    reportedBy: reportedBy || "Unknown",
    category,
    priority,
    status: "new",
    assignedTo: assignedVolunteer ? assignedVolunteer._id : null,
    createdAt: new Date().toISOString(),
  };
  reports.push(newReport);

  const newAction = {
    _id: "a" + actionCounter++,
    title: `Handle: ${title}`,
    type: priority === "urgent" || priority === "high" ? priority : "medium",
    progress: 0,
    assignedTo: assignedVolunteer ? assignedVolunteer._id : null,
    reportId: newReport._id,
    createdAt: new Date().toISOString(),
  };
  actions.push(newAction);

  saveData();

  res.json({
    success: true,
    data: newReport,
    aiDecision: {
      priority,
      category,
      assignedVolunteer: assignedVolunteer ? { name: assignedVolunteer.name, skills: assignedVolunteer.skills } : null,
      reason: aiReason,
    },
  });
});

app.get("/api/actions", auth, (req, res) => {
  const { type, search } = req.query;
  let list = [...actions];
  if (type && type !== "all") list = list.filter(a => a.type === type);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(a => a.title.toLowerCase().includes(s));
  }
  res.json({
    success: true,
    stats: {
      urgent: actions.filter(a => a.type === "urgent").length,
      high: actions.filter(a => a.type === "high").length,
      medium: actions.filter(a => a.type === "medium").length,
      total: actions.length,
    },
    data: list,
  });
});

app.patch("/api/actions/:id/assign", auth, (req, res) => {
  const action = actions.find(a => a._id === req.params.id);
  if (!action) return res.status(404).json({ success: false, message: "Action not found" });
  const { volunteerId } = req.body;
  const vol = volunteers.find(v => v._id === volunteerId);
  if (!vol) return res.status(404).json({ success: false, message: "Volunteer not found" });
  action.assignedTo = volunteerId;
  saveData();
  res.json({ success: true, data: action });
});

app.post("/api/actions/:id/suggest-volunteer", auth, async (req, res) => {
  const action = actions.find(a => a._id === req.params.id);
  if (!action) return res.status(404).json({ success: false, message: "Action not found" });

  const availableVols = volunteers.filter(v => v.status === "available");
  if (!availableVols.length) return res.status(400).json({ success: false, message: "No available volunteers" });

  const volList = availableVols.map(v => `${v._id}: ${v.name} (Skills: ${v.skills.join(", ")}, Location: ${v.location})`).join("\n");

  try {
    const aiResponse = await callAI(
      `Action: "${action.title}" (Type: ${action.type})`,
      `You are an AI for an NGO relief system. Pick the single best volunteer for this action and respond ONLY with valid JSON, no extra text:
{
  "volunteerId": "<_id>",
  "volunteerName": "<name>",
  "reason": "<one sentence>"
}
Available volunteers:
${volList}`
    );

    const cleaned = aiResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const suggested = volunteers.find(v => v._id === parsed.volunteerId);
    if (!suggested) return res.status(400).json({ success: false, message: "AI suggested invalid volunteer" });

    res.json({ success: true, volunteerId: parsed.volunteerId, volunteerName: parsed.volunteerName, reason: parsed.reason });
  } catch (e) {
    console.error("Suggest volunteer error:", e.message);
    const fallback = availableVols[0];
    res.json({ success: true, volunteerId: fallback._id, volunteerName: fallback.name, reason: "Selected based on availability" });
  }
});

app.post("/api/ai/chat", auth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: "Message is required" });

  const availableVols = volunteers.filter(v => v.status === "available").length;
  const urgentActions = actions.filter(a => a.type === "urgent");
  const newReportsCount = reports.filter(r => r.status === "new").length;

  try {
    const reply = await callAI(
      message,
      `You are an AI assistant for an NGO disaster relief coordination system. Answer concisely and helpfully.

Live system data:
- Volunteers: ${volunteers.length} total, ${availableVols} available
- Reports: ${reports.length} total, ${newReportsCount} pending
- Actions: ${actions.length} total, ${urgentActions.length} urgent
- Urgent actions: ${urgentActions.map(a => a.title).join("; ")}
- Volunteers: ${volunteers.map(v => `${v.name} (${v.status}, skills: ${v.skills.join(", ")}, location: ${v.location})`).join(" | ")}
- Recent reports: ${reports.slice(-3).map(r => `${r.title} [${r.priority}]`).join("; ")}`
    );

    res.json({ success: true, reply: reply || "I could not generate a response. Please try again." });
  } catch (e) {
    console.error("AI chat error:", e.message);
    res.status(500).json({ success: false, message: "AI service error" });
  }
});

app.listen(5000, () => console.log("NGO Backend running on http://localhost:5000"));