---
name: frontend-project-initialized
description: React + TypeScript + Vite + Tailwind CSS v4 frontend initialized for PaperPilot
metadata:
  type: project
---

PaperPilot frontend project initialized on 2026-06-29.
- Vite 8 + React 19 + TypeScript 6 + Tailwind CSS 4
- Dependencies: react-router-dom v7, @tanstack/react-query v5, axios, zustand v5
- Uses Tailwind CSS v4 with @tailwindcss/vite plugin (no PostCSS needed)
- API base URL defaults to http://localhost:8000, overridable via VITE_API_BASE_URL env var
- Auth token stored in localStorage under key `paperpilot_access_token`
- 401 responses trigger automatic token clearing and redirect to /login

**Why:** Standard modern React stack matching the project's TypeScript-first approach. Tailwind v4 simplifies config (no postcss.config.js, no tailwind.config.js).

**How to apply:** Run `cd frontend && npm run dev` to start dev server. The PaperListPage at /papers is the implemented page; placeholder pages exist for create/detail/tags/profile/login/register routes.
