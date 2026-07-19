<USER_REQUEST>
# Master Build Prompt — HireSense AI

Paste this into Claude Code, Cursor, or a fresh chat with Claude to build the project. It's split into 4 milestone prompts — run them **one at a time, in order**, so you get a working app at every stage instead of one giant broken drop.

---

## 🧩 Milestone 1 — Foundation (Auth, Roles, Dashboards, DB, Job Management)

```
Build the foundation of "HireSense AI," a full-stack resume screening platform.

Stack:
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Shadcn UI + React Router + TanStack Query + Axios + React Hook Form + Zod + React Hot Toast
- Backend: Node.js + Express + TypeScript + Prisma ORM
- Database: PostgreSQL (assume a Neon connection string in .env)
- Auth: JWT access + refresh tokens, bcrypt password hashing

Set up this repo structure:
HireSense-AI/
├── frontend/ (Vite React TS app)
├── backend/ (Express TS app)
├── docs/
└── README.md

Backend folders: src/controllers, src/middlewares, src/routes, src/services,
src/utils, src/config, prisma, src/types, server.ts

Frontend folders: src/components, src/layouts, src/pages, src/hooks,
src/services, src/contexts, src/routes, src/types, src/utils

Implement:
1. Prisma schema for Users (id, name, email, password, role[Candidate|HR|Admin], createdAt),
   CandidateProfile, and Jobs table (title, company, description, requiredSkills,
   experience, salary, location, createdBy).
2. Auth API: POST /auth/register, /auth/login, /auth/logout with JWT access +
   refresh tokens, bcrypt hashing, role-based access middleware.
3. Frontend: Landing page (Hero, Features, Pricing, Testimonials, FAQ, Footer),
   animated glassmorphism Login page, Register page with role selection
   (Candidate/HR), protected routes via React Router, auth context + TanStack
   Query hooks.
4. Candidate Dashboard shell (sidebar: Dashboard, Profile, Resume, Jobs,
   Applications, Notifications, Settings, Logout) with placeholder cards for
   Resume Score, Jobs Applied, Profile Completion, Interview Chances.
5. HR Dashboard shell (sidebar: Dashboard, Jobs, Candidates, Analytics,
   Reports, Settings) with placeholder cards for Open Jobs, Candidates,
   Applications, Interviews.
6. Basic Job CRUD: POST/GET/PUT/DELETE /jobs, wired to an HR "Create Job" form
   and a public job listing page.
7. Security basics: Helmet, CORS, express-rate-limit, input validation with Zod
   on both ends.

Give me working code end-to-end (not pseudocode), a seed script with one demo
HR account and one demo Candidate account, and clear setup instructions
(.env.example, npm scripts, how to run Prisma migrate).
```

---

## 🧩 Milestone 2 — Core Hiring Flow

```
Continuing the HireSense AI project (foundation already built), add:

1. Prisma models for Applications (jobId, candidateId, resumeId, status[Applied|
   Shortlisted|Rejected|Interview|Selected], appliedAt) and link to Jobs/Users.
2. Resume upload: POST /candidate/upload-resume storing the file in Cloudinary
   and the URL in CandidateProfile. Support PDF and DOCX via pdf-parse and
   mammoth; add Tesseract OCR fallback for scanned PDFs.
3. Candidate Resume page: upload / replace / view / delete resume.
4. Candidate Jobs page: search, filter, apply, save job.
5. Candidate Applications page: status timeline UI (Applied → Shortlisted →
   Interview → Selected).
6. Full Candidate Profile page: personal info, education, experience, skills,
   social links, with a profile-completion percentage calculation.
7. HR Candidates page: search/filter/sort candidates, side-by-side compare,
   candidate detail view (resume, experience, education, skills, projects).
8. HR Applications management: change application status, view applicants
   per job.

Keep everything wired to real API calls (no mock data), and update the seed
script with a couple of sample jobs and applications so the flow is
demoable immediately.
```

---

## 🧩 Milestone 3 — AI Features (Gemini)

```
Continuing HireSense AI, add the AI layer using Google Gemini:

1. Prisma model ResumeAnalysis (resumeId, atsScore, matchScore, missingSkills,
   strengths, weaknesses, recommendation).
2. POST /ai/analyze-resume: extract resume text (reuse Milestone 2 parsing),
   send resume + target job description to Gemini, and get back ATS score,
   missing skills, strengths, weaknesses, and a recommendation summary. Save
   to ResumeAnalysis and display it in both dashboards.
3. POST /ai/match-job: semantic match score between a candidate's resume and
   a specific job, using this weighting: Skills Match 50%, Experience 20%,
   Education 10%, Projects 10%, Certifications 10%.
4. POST /ai/improve-resume: AI suggestions to improve the resume for a given
   job.
5. Explainable AI UI: instead of a bare percentage, show a checklist —
   ✓ matched skills in green, ✗ missing skills in red, plus a plain-language
   "Good Fit / Partial Fit / Not a Fit" recommendation.
6. Add an AI Interview Question Generator and an AI Cover Letter Generator as
   two extra endpoints + UI panels, both driven off the parsed resume + job
   description.

Handle Gemini API errors and rate limits gracefully (loading states, retry,
fallback message). Keep the Gemini API key server-side only, never exposed
to the frontend.
```

---

## 🧩 Milestone 4 — Production Polish

```
Finish HireSense AI for production:

1. HR Analytics page: bar chart (applications per job), pie chart (hiring
   funnel: Applied/Shortlisted/Interview/Selected), average ATS score, top
   requested skills — using Recharts, fed by a GET /analytics endpoint.
2. Email notifications on application status change (use a transactional
   email service via SMTP or an API — stub it behind an interface so the
   provider is swappable).
3. Dark/Light mode toggle with persisted user preference.
4. Audit log for HR actions (job created/edited/deleted, status changes).
5. Admin dashboard: manage users, jobs, and view audit logs.
6. Demo mode: a "Try Demo" button on the landing page that logs into
   preloaded HR and Candidate accounts instantly, no signup needed.
7. Responsive design pass on every page (mobile/tablet breakpoints).
8. Basic test coverage: auth flow, job CRUD, and resume analysis endpoint
   (Jest + Supertest on backend; Vitest + React Testing Library on frontend).
9. Deployment config: frontend → Vercel (vercel.json), backend → Railway
   (railway config / Dockerfile if needed), confirm Neon + Cloudinary env
   vars are documented in README.

Deliver a final README with setup, env vars, architecture diagram (ASCII is
fine), and a features checklist matching what's actually implemented.
```

---

### Tips for using these prompts
- Run them in order — each depends on the previous milestone's code existing.
- If using **Claude Code**, drop the whole repo path in and paste one milestone
  at a time as a message; it can read/write files directly.
- If using a **chat-only** tool, ask it to output complete files (not snippets)
  so you can copy them in one pass, and request a zip/tarball if supported.
- Keep your `.env` files out of git from the start (`backend/.env`,
  `frontend/.env`) — add a `.env.example` instead.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-07-16T17:22:12+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.5 Flash (Medium). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>