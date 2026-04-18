🔷 Technology Stack
Runtime: Node.js / Python (FastAPI)
API Type: RESTful APIs
Database: Firebase Firestore
Authentication: Firebase Auth (optional)
Storage (optional): Firebase Storage
AI Integration: LLM (OpenAI / local model)
🔷 Core Functional Modules
1. API Layer (Request Handling)

The backend exposes REST APIs to receive and manage data from the frontend.

Key Endpoint:
POST /api/reports/upload
Responsibilities:
Accept raw text reports from NGO workers
Validate request payload
Forward data for AI processing
Return structured response
2. AI Processing Module

This module converts unstructured text into structured disaster intelligence.

Input:

Raw field report (natural language)

Example:
"Village: Rampur. Severe food shortage affecting 50 families..."
Processing:
Extract location
Identify type of issue (food, medical, shelter, etc.)
Estimate severity level
Detect number of affected people
Assign urgency score
Output (Structured JSON):
{
  location: "Rampur",
  issue: "Food Shortage",
  severity: "High",
  affected_people: 50,
  priority_score: 9
}
3. Business Logic Layer

Applies logic to make the system intelligent and useful.

Responsibilities:
Compute priority score based on:
severity
number of people affected
Categorize reports (critical, moderate, low)
Enable filtering and sorting of reports
Handle edge cases (missing or unclear data)
4. Database Layer (Firebase Firestore)

Stores all processed and raw reports.

Collection: reports
Document Structure:
{
  raw_text: "...",
  location: "Rampur",
  issue: "Food Shortage",
  severity: "High",
  affected_people: 50,
  priority_score: 9,
  created_at: timestamp
}
Responsibilities:
Persist reports
Enable fast retrieval
Support real-time updates (if needed)
5. Authentication Layer (Optional)

Using Firebase Auth:

Features:
NGO worker login
Admin access control
Secure API usage
6. File Handling (Optional)

Using Firebase Storage:

Supports:
Uploading images from disaster sites
Storing PDFs or reports
🔷 Data Flow (End-to-End)
User submits a report from frontend
Backend API receives request
Data is validated
Sent to AI processing module
Structured output is generated
Business logic assigns priority
Data is stored in Firebase
Response is returned to frontend
