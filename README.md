FrontierOdyssey
FrontierOdyssey is an AI-powered educational platform designed for high school students (grades 9–12), delivering rigorous, narrative-driven challenges in science, math, and English. Through real-world scenarios (e.g., optimizing a microgrid, analyzing historical texts), the app fosters critical thinking, trade-offs, and practical applications, using an AI mentor with Socratic dialogue and direct instruction. Built with Supabase for backend and authentication, Next.js with Tailwind CSS for a sleek frontend, and Next.js App Router for navigation, the MVP targets alpha testing with 50 students by May 2025, supporting 5 challenges and personalized learning via ELO ratings and AI-parsed interests.
Features

Narrative Challenges: 5 challenges (2 science, 2 math, 1 English) with 70% hands-on tasks and 30% virtual exploration, designed for 15–20-minute sessions.
AI Mentor: Combines direct instruction and Socratic questions, with wise feedback to boost engagement.
ELO Rating System: Matches students to challenges based on skill level, tracking progress with historical grade data.
Conversational Onboarding: Captures student interests via free-text conversations, parsed by AI for personalized challenge recommendations.
Secure Authentication: Supabase Auth with email and Google SSO, integrated with auth.users.
Progress Tracking: Digital passport displays ELO history, mastery levels, and reflections.

Tech Stack

Frontend: Next.js (TypeScript), Tailwind CSS, Next.js App Router
Backend: Supabase (PostgreSQL), TypeScript edge functions
Authentication: Supabase Auth (email, OAuth)
AI: Lightweight LLM (e.g., Hugging Face Mistral 7B) for dialogue and interest parsing
Hosting: AWS Amplify for Next.js hosting (MVP); Vercel evaluation pending

Directory Structure
frontend
├── app
│   ├── auth
│   │   ├── callback
│   │   └── confirm
│   ├── check-email
│   ├── components
│   ├── dashboard
│   │   ├── challenges
│   │   │   ├── [challenge_id]
│   │   │   ├── active
│   │   │   ├── completed
│   │   │   ├── on-hold
│   │   │   └── recommended
│   │   ├── onboarding
│   │   ├── profile
│   │   └── review_onboarding
│   ├── error
│   │   └── login
│   ├── login
│   └── signup
├── public
└── utils
    └── supabase


Database Schema
The database is managed in Supabase's public schema, integrated with auth.users for authentication. The schema is split into two migration files for clarity:
Schema (supabase/migrations/000001_initial_schema.sql)

Tables:
user_info: Student profiles (UUID id, email, grade_level, interests, subject_comfort, onboarded, etc.), linked to auth.users.
conversations: Conversation threads (onboarding, challenges).
messages: Conversational data (questions, responses, edit logs) with search_vector for text search.
feedback: Onboarding and survey feedback.
elo_ratings: ELO history for skill-based challenge matching.
challenges: Challenge metadata (5 seeded challenges for science, math, English).
mastery_logs: Skill mastery per challenge.


Indices: Optimize for ELO matching, conversation searches, and analytics.
Seed Data: 5 challenges for MVP testing.

RLS Policies (supabase/migrations/000002_user_profile.sql)

Ensures students access only their data (auth.uid() = user_id).
Admins (has_role('admin')) manage challenges and view all data.
Policies cover SELECT, INSERT, and UPDATE for secure access.

Setup Instructions
Clone the Repository
git clone https://github.com/your-username/frontier-odyssey.git
cd frontier-odyssey

Frontend Setup
cd frontend
npm install
npm run dev

Configure .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-key
NEXT_PUBLIC_LLM_API_KEY=your-llm-key

Supabase Setup

Create a Supabase project (free tier) at app.supabase.com.
Enable authentication (email, Google OAuth):
Go to Authentication > Providers in Supabase dashboard.
Enable Email auth with "Confirm email" option.
Enable Google OAuth:
Create a Google Cloud Project at console.cloud.google.com.
Enable Google OAuth2 API.
Configure OAuth consent screen (internal-only recommended).
Create OAuth 2.0 Client credentials.
Add authorized redirect URIs:
http://localhost:3000/auth/callback (development)
https://[YOUR_SUPABASE_PROJECT].supabase.co/auth/v1/callback (production)


Add authorized JavaScript origins:
http://localhost:3000 (development)
https://[YOUR_DOMAIN] (production)


Copy Client ID and Client Secret to Supabase Auth > Providers > Google.




Deploy schema and RLS:supabase db push --file supabase/migrations/000001_initial_schema.sql
supabase db push --file supabase/migrations/000002_user_profile.sql


Deploy edge functions (e.g., elo-update, interest-parser):supabase functions deploy elo-update
supabase functions deploy interest-parser



Hosting

MVP Hosting: Deploy Next.js app to AWS Amplify:cd frontend
npm run build
amplify init
amplify push


Production Hosting: Evaluate Vercel or AWS Amplify with CloudFront for scalability.
Update .env for production hosting.

Testing

Create test users in Supabase Auth.
Run alpha tests with 50 students, monitoring elo_ratings and conversations.

Contributing

Submit issues/pull requests to GitHub Issues.
Follow coding standards (TypeScript, ESLint, Prettier).
Test schema changes locally with Supabase CLI (supabase db start).

Roadmap

May 2025: Prototype 5 challenges, deploy schema, alpha test with 50 students.
June–August 2025: MVP with 50 challenges, full AI integration, beta testing.
September 2025: Launch with 200 challenges, school partnerships.

