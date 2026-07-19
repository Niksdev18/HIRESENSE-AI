# HireSense AI — Full-Stack Resume Screening Platform

Welcome to the **HireSense AI** codebase. This repository contains the full-stack code for the complete platform implementation (Milestones 1 to 4).

---

## 🏗️ Architecture Layout

```
HireSense-AI/
├── frontend/             # Vite + React 19 + TypeScript + Tailwind CSS (v4)
├── backend/              # Node.js + Express + TypeScript + Prisma ORM
└── docs/                 # Documentation assets
```

### Flow Overview
```
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│  Vite React App │ ──────────> │ Express Backend │ ──────────> │ PostgreSQL DB   │
│  (Port 5173)    │ <────────── │ (Port 5000)     │ <────────── │ (Neon / Local)  │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

---

## ⚙️ Prerequisites & Environment Setup

### 1. Database Configuration
Ensure you have a running PostgreSQL database. You can use a local PostgreSQL server or create a free PostgreSQL instance on **Neon**.

### 2. Backend Config (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
JWT_SECRET="generate_a_long_random_jwt_access_secret_key_change_me_in_production"
JWT_REFRESH_SECRET="generate_a_long_random_jwt_refresh_secret_key_change_me_in_production"
ALLOWED_ORIGINS="http://localhost:5173"
GEMINI_API_KEY="AIzaSyYourActualGeminiAPIKeyHere"
```

### 3. Frontend Config (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL="http://localhost:5000"
VITE_ENABLE_DEMO=true
```

---

## 🚀 Running the Project

### 1. Install Dependencies
Run in both directories:
```bash
# In backend/
npm install

# In frontend/
npm install
```

### 2. Database Migrations & Seeding
Prepare the Prisma client and database schema, then seed the demo accounts:
```bash
# In backend/
# 1. Run migrations to create schema tables in PostgreSQL
npx prisma migrate dev --name init

# 2. Generate the typed client files
npx prisma generate

# 3. Seed demo accounts
npm run prisma:seed
```

### 3. Running Automated Tests
To execute the backend Jest test suite, run:
```bash
# In backend/
npm run test
```

### 4. Running Servers
Start the dev servers for both components:
```bash
# In backend/
npm run dev

# In frontend/
# Launches on http://localhost:5173
npm run dev
```

---

## 🔑 Demo Account Credentials

Use these pre-loaded accounts to test role actions instantly:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@hiresense.ai` | `password123` |
| **HR Manager** | `hr@hiresense.ai` | `password123` |
| **Candidate** | `candidate@hiresense.ai` | `password123` |

> [!IMPORTANT]
> **Production Security Warning**: The seeded demo account passwords (e.g. `password123`) are for local testing only. Before deploying to any public staging or production environment, make sure to change the seed credentials in `backend/prisma/seed.ts` or deactivate the accounts via the Admin Dashboard.

---

## 🔒 Security Design

1. **Tokens**: JWT Refresh tokens are stored in secure `HttpOnly`, `SameSite=Strict` cookies. Short-lived Access tokens reside strictly in-memory (React context).
2. **Revocation**: Refresh tokens are stored in the `RefreshToken` database table. Logging out revokes the session server-side.
3. **CORS**: Wildcards are disabled. Backend strictly allows origins defined in `ALLOWED_ORIGINS`.
4. **Middlewares**: Enforces security headers via `helmet` and limits request volumes per IP via `express-rate-limit`.
5. **Auditing**: Records administrative and recruiting actions in `AuditLog` chronologically.
6. **Soft Deactivation**: Prevents cascade data deletion when removing users by deactivating accounts rather than hard-deleting record relations.

