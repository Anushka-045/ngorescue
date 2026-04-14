# NGO Relief Management System — Backend API

A complete Node.js backend for managing crisis relief operations: from raw NGO field reports through OCR/NLP processing, urgency scoring, volunteer matching, real-time notifications, and impact tracking.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- **npm** v7 or higher

### 1. Install Dependencies
```bash
cd ngo-relief-backend
npm install
```

### 2. Configure Environment
The `.env` file is pre-configured for local development. No changes needed to get started.

### 3. Seed Demo Data
```bash
npm run seed
```
This creates demo volunteers, reports, tasks, and users.

### 4. Start the Server
```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

Server runs at: **http://localhost:3000**

---

## 🔐 Demo Credentials

| Role      | Email                   | Password  |
|-----------|-------------------------|-----------|
| Admin     | admin@ngo.org           | admin123  |
| Volunteer | rohit@volunteer.org     | vol123    |
| Volunteer | anjali@volunteer.org    | vol123    |

---

## 📡 API Endpoints

### Base URL: `http://localhost:3000/api`

---

### 🔑 Auth

| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| POST   | `/auth/register`      | Register new user   |
| POST   | `/auth/login`         | Login, get JWT token |

**Login Request:**
```json
POST /api/auth/login
{
  "email": "admin@ngo.org",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Admin User", "role": "admin" }
}
```

---

### 📋 Reports — THE CORE PIPELINE

| Method | Endpoint                | Description                           |
|--------|-------------------------|---------------------------------------|
| POST   | `/reports/upload`       | Upload report → Full pipeline runs    |
| GET    | `/reports`              | List all reports                      |
| GET    | `/reports/:id`          | Get report + task details             |

**Upload Report (text):**
```bash
curl -X POST http://localhost:3000/api/reports/upload \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "Village: Rampur. Issue: Severe food shortage affecting 50 families. Children are malnourished. No food supply for last 3 days. Location: Near Govt School, Rampur. Urgency: High"
  }'
```

**Upload Report (file):**
```bash
curl -X POST http://localhost:3000/api/reports/upload \
  -F "report=@report.txt"
```

**Pipeline Response:**
```json
{
  "success": true,
  "message": "Report processed. Priority: Critical",
  "pipeline": {
    "step1_ocr_nlp": {
      "location": "Rampur, Near Govt School",
      "issue_type": "Food Shortage",
      "people_affected": 50,
      "severity": "High",
      "keywords": ["food shortage", "malnourished", "children"],
      "vulnerable_groups": ["children"],
      "timestamp": "2026-04-03T14:30:00.000Z"
    },
    "step2_urgency_score": {
      "urgency_score": 92,
      "priority_level": "Critical",
      "action_required": "Immediate Action Required",
      "reason": [
        "Severity classified as High",
        "Children are among the affected population",
        "No supply for 3 days",
        "High number of people affected (50 families)"
      ],
      "score_breakdown": {
        "severity_score": 30,
        "vulnerable_group_score": 12,
        "days_without_score": 20,
        "people_affected_score": 10,
        "keyword_score": 6
      }
    },
    "step3_volunteer_match": {
      "assigned_to": "Rohit Sharma",
      "task": "Deliver food supplies to 50 families",
      "eta": "15 minutes",
      "status": "Assigned",
      "match_score": 87
    },
    "step4_task": {
      "task_id": "uuid-here",
      "status": "assigned",
      "eta": "15 minutes"
    }
  },
  "report_id": "uuid-here",
  "task_id": "uuid-here"
}
```

---

### 👥 Volunteers

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| POST   | `/volunteers`                   | Register new volunteer       |
| GET    | `/volunteers`                   | List all volunteers          |
| GET    | `/volunteers/:id`               | Get volunteer + their tasks  |
| PUT    | `/volunteers/:id/status`        | Update availability status   |
| GET    | `/volunteers/skills/list`       | List all available skills    |

**Register Volunteer:**
```json
POST /api/volunteers
{
  "name": "Rahul Gupta",
  "email": "rahul@vol.org",
  "phone": "+91-9999999999",
  "location": "Rampur",
  "skills": ["Food Distribution", "Logistics"],
  "availability": "Immediate"
}
```

**Query Params for GET /volunteers:**
- `?status=available` — filter by status (available/on_duty/offline)
- `?skill=Medical` — filter by skill
- `?location=Rampur` — filter by location

---

### ✅ Tasks

| Method | Endpoint                  | Description                       |
|--------|---------------------------|-----------------------------------|
| GET    | `/tasks`                  | List all tasks                    |
| GET    | `/tasks/:id`              | Get task details + report         |
| PUT    | `/tasks/:id/accept`       | Volunteer accepts task            |
| PUT    | `/tasks/:id/complete`     | Mark task complete + log impact   |
| PUT    | `/tasks/:id/decline`      | Volunteer declines task           |

**Complete Task (with impact data):**
```json
PUT /api/tasks/:id/complete
{
  "families_helped": 50,
  "individuals_helped": 200,
  "meals_delivered": 200,
  "notes": "All families received ration kits successfully"
}
```

---

### 📊 Dashboard

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/dashboard/stats`    | Stats panel (counts, totals)       |
| GET    | `/dashboard/map`      | Map data with priority markers     |
| GET    | `/dashboard/needs`    | Needs list table                   |

**Stats Response:**
```json
{
  "total_requests": 12,
  "critical_cases": 3,
  "volunteers_active": 18,
  "tasks_completed_today": 25,
  "volunteers_on_duty": 4,
  "pending_cases": 5,
  "resolved_cases": 7
}
```

---

### 🌟 Impact (For Judges / Demo)

| Method | Endpoint               | Description                         |
|--------|------------------------|-------------------------------------|
| GET    | `/impact/summary`      | Overall impact metrics              |
| GET    | `/impact/metrics`      | Time-series + by issue type         |

**Impact Summary Response:**
```json
{
  "title": "NGO Relief System – Impact Summary",
  "metrics": {
    "total_families_helped": 50,
    "total_meals_delivered": 200,
    "volunteers_deployed": 5,
    "avg_response_time_minutes": 12,
    "critical_cases_resolved": 3
  },
  "highlight_cards": [
    { "label": "Families Helped",     "value": 50,  "icon": "🏠" },
    { "label": "Meals Delivered",     "value": 200, "icon": "🍱" },
    { "label": "Volunteers Deployed", "value": 5,   "icon": "🙋" },
    { "label": "Avg Response (mins)", "value": 12,  "icon": "⚡" }
  ]
}
```

---

## 🔌 WebSocket Events (Real-Time)

Connect to: `ws://localhost:3000`

| Event               | Direction          | Payload                                          |
|---------------------|--------------------|--------------------------------------------------|
| `task_assigned`     | Server → Volunteer | Full task details with map link                  |
| `new_report`        | Server → Admin     | New critical report alert                        |
| `task_update`       | Server → All       | Status changes (accepted/completed/declined)     |
| `join_room`         | Client → Server    | Join `admin` or `volunteer_<id>` room            |

**JavaScript Client Example:**
```javascript
const socket = io('http://localhost:3000');

// Admin joins admin room
socket.emit('join_room', 'admin');

// Volunteer joins their personal room
socket.emit('join_room', 'volunteer_<volunteer_id>');

// Listen for new task
socket.on('task_assigned', (data) => {
  console.log('New task:', data);
  // data.task.map_link → Google Maps URL
  // data.task.priority → 'Critical'
});

// Listen for new reports (admin)
socket.on('new_report', (data) => {
  console.log('New report:', data.location, data.priority);
});
```

---

## 📁 Project Structure

```
ngo-relief-backend/
├── src/
│   ├── server.js                    # Entry point, Express + Socket.IO setup
│   ├── config/
│   │   └── database.js              # LowDB file-based database
│   ├── routes/
│   │   ├── auth.routes.js           # Register / Login
│   │   ├── report.routes.js         # Upload + full pipeline
│   │   ├── volunteer.routes.js      # Volunteer management
│   │   ├── task.routes.js           # Task accept/complete/decline
│   │   ├── dashboard.routes.js      # Admin dashboard stats + map
│   │   └── impact.routes.js         # Impact metrics
│   ├── services/
│   │   ├── nlp.service.js           # OCR + NLP text extraction
│   │   ├── urgency.service.js       # Urgency scoring engine (0–100)
│   │   ├── matching.service.js      # Volunteer matching algorithm
│   │   ├── notification.service.js  # WebSocket + notification storage
│   │   └── impact.service.js        # Impact tracking & aggregation
│   ├── middleware/
│   │   └── auth.middleware.js       # JWT authentication + RBAC
│   └── utils/
│       ├── logger.js                # Winston logger
│       └── seed.js                  # Demo data seeder
├── data/
│   └── db.json                      # Auto-created file database
├── uploads/                         # Uploaded report files
├── logs/                            # Application logs
├── .env                             # Environment config
├── package.json
└── README.md
```

---

## 🎯 Demo Flow (Hackathon Presentation)

```
1. npm run seed              → Load demo data
2. npm start                 → Start server
3. GET  /api/dashboard/stats → Show current state (12 requests, 3 critical)
4. POST /api/reports/upload  → Submit Rampur food shortage report
                               ↓ See full pipeline response:
                               - NLP extracts location, issue, people
                               - Urgency score: 92 (Critical)
                               - Rohit Sharma matched & assigned (ETA 15 min)
5. GET  /api/dashboard/map   → Show map data with Critical marker
6. GET  /api/dashboard/needs → Show needs list table
7. PUT  /api/tasks/:id/accept   → Rohit accepts (WebSocket fires)
8. PUT  /api/tasks/:id/complete → Mark done, log 50 families / 200 meals
9. GET  /api/impact/summary  → Show impact: 50 families, 200 meals, 12 min
```

---

## ⚙️ What You Need From Your Side

| Item | Status | Notes |
|------|--------|-------|
| Node.js ≥ v16 | **Install** | https://nodejs.org |
| `npm install` | **Run once** | Installs all packages |
| `npm run seed` | **Run once** | Loads demo data |
| MongoDB / PostgreSQL | ❌ Not needed | Uses file DB (zero config) |
| API keys | ❌ Not needed | NLP is built-in |
| Frontend | ❌ Not needed | Backend only as requested |

### For Production Upgrades (Post-Hackathon)
- Replace file DB with **MongoDB** or **PostgreSQL**
- Add **Tesseract.js** for real OCR on image/PDF uploads
- Add **Firebase Cloud Messaging** for mobile push notifications
- Add **Google Maps Geocoding API** for real GPS coordinates
- Add **Twilio SMS** for volunteer alerts via SMS

---

## 🧪 Quick Test with curl

```bash
# 1. Seed demo data
npm run seed

# 2. Start server
npm start

# 3. Test health
curl http://localhost:3000/health

# 4. Submit the Rampur report
curl -X POST http://localhost:3000/api/reports/upload \
  -H "Content-Type: application/json" \
  -d '{"raw_text": "Village: Rampur. Severe food shortage affecting 50 families. Children malnourished. No food for 3 days. Urgency: High"}'

# 5. Check dashboard
curl http://localhost:3000/api/dashboard/stats

# 6. Check impact
curl http://localhost:3000/api/impact/summary
```
