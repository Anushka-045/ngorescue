# NGO Relief System - Backend v2

## Setup

1. Install dependencies:
   npm install

2. Add your OpenRouter API key in .env:
   OPENROUTER_API_KEY=your_key_here

   Get a free key at: https://openrouter.ai

3. Start the server:
   npm run dev

## Login Credentials

   Admin     → admin@ngorescue.com  / admin123
   Volunteer → volunteer@ngorescue.com / vol123

## API Endpoints

   POST   /api/auth/login
   GET    /api/volunteers
   POST   /api/volunteers
   PATCH  /api/volunteers/:id/toggle-status
   GET    /api/reports
   POST   /api/reports
   GET    /api/actions
   PATCH  /api/actions/:id/assign
   POST   /api/ai/chat

## AI Assistant

   Uses meta-llama/llama-3.3-70b-instruct:free via OpenRouter.
   The AI has full live context of all volunteers, reports, and actions.
   It can answer questions and suggest volunteer assignments.

## Notes
   - No database. All data is in-memory (resets on server restart).
   - Server runs on http://localhost:5000
