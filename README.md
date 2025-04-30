FrontierOdyssey
FrontierOdyssey is an AI-powered educational platform designed for high school students (grades 9–12), delivering rigorous, narrative-driven challenges in science, math, and English. Through real-world scenarios (e.g., optimizing a microgrid, analyzing historical texts), the app fosters critical thinking, trade-offs, and practical applications, using an AI mentor with Socratic dialogue and direct instruction. Built with Supabase for backend and authentication, React with Tailwind CSS for a sleek frontend, and React Router for navigation, the MVP targets alpha testing with 50 students by May 2025, supporting 5 challenges and personalized learning via ELO ratings and AI-parsed interests.
Features

Narrative Challenges: 5 challenges (2 science, 2 math, 1 English) with 70% hands-on tasks and 30% virtual exploration, designed for 15–20-minute sessions.
AI Mentor: Combines direct instruction and Socratic questions, with wise feedback to boost engagement.
ELO Rating System: Matches students to challenges based on skill level, tracking progress with historical grade data.
Conversational Onboarding: Captures student interests via free-text conversations, parsed by AI for personalized challenge recommendations.
Secure Authentication: Supabase Auth with email and Google SSO, integrated with auth.users.
Progress Tracking: Digital passport displays ELO history, mastery levels, and reflections.

Tech Stack

Frontend: React (TypeScript), Tailwind CSS, React Router, Vite
Backend: Supabase (PostgreSQL), TypeScript edge functions
Authentication: Supabase Auth (email, OAuth)
AI: Lightweight LLM (e.g., Hugging Face DistilBERT) for dialogue and interest parsing
Hosting: Temporary GitHub Pages/Netlify for MVP; Vercel/AWS Amplify evaluation pending

Directory Structure
frontier-odyssey/
├── frontend
│   ├── app
│   │   ├── routes
│   │   │   └── home.tsx
│   │   ├── welcome
│   │   │   ├── logo-dark.svg
│   │   │   ├── logo-light.svg
│   │   │   └── welcome.tsx
│   │   ├── app.css
│   │   ├── root.tsx
│   │   └── routes.ts
│   ├── public
│   │   └── favicon.ico
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package-lock.json
│   ├── package.json
│   ├── react-router.config.ts
│   ├── README.md
│   ├── tsconfig.json
│   └── vite.config.ts
├── supabase
│   ├── functions
│   ├── migrations
│   │   ├── 000001_frontier_odyssey_schema.sql
│   │   └── 000002_frontier_odyssey_rls.sql
│   └── seed.sql
├── .DS_Store
├── .gitignore
└── README.md

Database Schema
The database is managed in Supabase’s public schema, integrated with auth.users for authentication. The schema is split into two migration files for clarity:
Schema (supabase/migrations/000001_frontier_odyssey_schema.sql)

Tables:
user_info: Student profiles (UUID id, email, current_grade, created_at), linked to auth.users.
student_conversations: Conversational data (e.g., interests) for AI parsing, with search_vector for text search.
student_elo_ratings: ELO history with rating, grade, and rating_date to track progress.
challenges: Challenge metadata (5 seeded challenges for science, math, English).
mastery_logs: Skill mastery per challenge.
interactions: Student responses and AI feedback.


Indices: Optimize for ELO matching, conversation searches, and analytics.
Seed Data: 5 challenges for MVP testing.

RLS Policies (supabase/migrations/000002_frontier_odyssey_rls.sql)

Ensures students access only their data (auth.uid() = student_id).
Admins (has_role('admin')) manage challenges and view all data.
Policies cover SELECT, INSERT, and UPDATE for secure access.

Setup Instructions

Clone the Repository:
git clone https://github.com/your-username/frontier-odyssey.git
cd frontier-odyssey


Frontend Setup:
cd frontend
npm install
npm run dev


Configure .env with Supabase and LLM API keys:REACT_APP_SUPABASE_URL=https://your-supabase-project.supabase.co
REACT_APP_SUPABASE_KEY=your-public-key
REACT_APP_LLM_API_KEY=your-llm-key




Supabase Setup:

Create a Supabase project (free tier) at app.supabase.com.
Enable authentication (email, Google OAuth).
Deploy schema and RLS:supabase db push --file supabase/migrations/000001_frontier_odyssey_schema.sql
supabase db push --file supabase/migrations/000002_frontier_odyssey_rls.sql


Deploy edge functions (e.g., elo-update, interest-parser):supabase functions deploy elo-update
supabase functions deploy interest-parser




Temporary Hosting:

Build and deploy frontend to GitHub Pages or Netlify:cd frontend
npm run build
npm install -D gh-pages
gh-pages -d build


Update .env for production hosting when choosing Vercel/AWS Amplify.


Testing:

Create test users in Supabase Auth.
Run alpha tests with 50 students, monitoring student_elo_ratings and student_conversations.



Contributing

Submit issues/pull requests to GitHub Issues.
Follow coding standards (TypeScript, ESLint, Prettier).
Test schema changes locally with Supabase CLI (supabase db start).

Roadmap

May 2025: Prototype 5 challenges, deploy schema, alpha test with 50 students.
June–August 2025: MVP with 50 challenges, full AI integration, beta testing.
September 2025: Launch with 200 challenges, school partnerships.
