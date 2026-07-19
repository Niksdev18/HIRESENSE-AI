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
   Resume Scor
<truncated 3679 bytes>
ics endpoint.
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