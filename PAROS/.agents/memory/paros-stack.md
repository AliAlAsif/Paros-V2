---
name: PAROS stack decisions
description: Stack, conventions, and known gotchas for the PAROS academic OS project
---

## Stack
- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui + Wouter + Recharts (artifacts/paros/)
- Backend: Express 5, Drizzle ORM, PostgreSQL (artifacts/api-server/)
- OpenAPI spec → Orval → lib/api-client-react (React Query hooks) + lib/api-zod (Zod schemas)

## Critical: Date Fields Are Strings
All Drizzle schema date columns use `date({ mode: "string" })`. When inserting/updating rows where Zod has coerced the field to a Date object, always cast: `String(parsed.data.examDate)`.

**Why:** Drizzle's PgDateString column rejects Date objects. Orval generates `zod.coerce.date()` for OpenAPI `format: date` fields, so parsed values arrive as Date but Drizzle only accepts strings.

**How to apply:** Any route inserting/updating a date-mode column must convert with String() before passing to db.insert/update.

## Project Task Scoping (IDOR fix)
Update and delete on project tasks scope WHERE by BOTH taskId AND projectId to prevent cross-project mutations.

## Dashboard Nullable Fields
prayerToday and exerciseToday in dashboard summary are nullable (no log for today = null). OpenAPI spec marks them as oneOf [PrayerLog, null].
