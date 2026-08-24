# Fresher Frenzy · Freshers '26 — PRD

## Problem Statement
Round 1 targeted UI refresh over the existing Fresher Frenzy holographic event site — no backend contract changes. Preserve registration, pass lookup, admin login, protected QR scanner (camera + manual) and holographic design language.

## User Personas
- **Fresher (attendee)** — reads hero, opens invitation, registers, pulls up their digital ticket at gate.
- **Organiser / Admin (B.Com Association)** — signs into admin portal, monitors stats, scans passes.

## Core (static) Requirements
- Public homepage with branding, tagline, countdown, lineup, invitation letter, register CTA.
- Registration form (POST /api/register) → generates FF-xxxx pass.
- Pass lookup (GET /api/pass/:id) and dismissable digital ticket display.
- Admin login (POST /api/admin/login) with session token.
- Protected QR scanner (POST /api/scan) with camera + manual fallback.
- Admin stats dashboard (GET /api/stats).
- Fully responsive; reduced-motion respected.

## Round 1 — Implemented (Feb 2026)
- Prominent branding block: `B.COM ASSOCIATION × GOKUL CAMPUS` (`data-testid=brand-tag`).
- Hero headline: `FRESHERS '26`; exact tagline `Two Days, One Campus, New Faces, New Journey, Join B.Com Family` (`data-testid=hero-tagline`).
- Redesigned hero side-note: `COUNTDOWN / FRESHERS '26 / 01 SEPT · 09:00 · GOKUL CAMPUS`.
- Enhanced countdown panel: label `COUNTDOWN · FRESHERS '26`, heading `THE WAIT IS ALMOST OVER`, animated flip digits, holographic progress bar.
- Nav item label `JOIN` → `REGISTER`; tagline word "Join B.Com Family" preserved.
- Interactive lineup: click-to-expand rows with descriptions (`data-testid=lineup-row-{day}-{i}` + `-more`).
- Premium digital ticket: holographic foil strip, corner-marked QR, meta rows (event date, venue, gates open, dress code), animated status dot, high-contrast top labels.
- Pass dismiss button (`data-testid=dismiss-pass-button`) — session-only hide via `sessionStorage['frenzy-pass-hidden']`; restore button (`data-testid=restore-pass-button`) reveals the same pass; NO backend delete.
- Empty pass state has REGISTER NOW CTA (`data-testid=empty-pass-register-button`).
- Expandable protected Admin Portal (`data-testid=admin-hero`) with 3 stat cards (total/admitted/pending) and 3 collapsible sections (ops/events/team).
- Register/AdminModal error handling now surfaces FastAPI `data.detail` and no longer fabricates local passes or fake tokens.
- Mobile hero fully responsive at 375×812 (stacked side-note, no overflow).

## What's Implemented (cumulative)
- Holographic dark theme (DM Mono / Space Grotesk / Unbounded).
- Registration, pass lookup, admin login, camera + manual scanner, admin stats.
- Framer Motion for entrance/expand animations.
- Session-persisted admin token; session-persisted pass-hidden flag.

## Backlog (Prioritized)
- **P1 · Persist backend data in MongoDB** — currently in-memory dicts; admin panel honestly labels "IN-MEMORY (DEMO)".
- **P1 · Return 401 (not 403) from /api/admin/login on bad creds** — convention only.
- **P2 · Downloadable / share-able ticket image** (PNG/PDF) for pockets and WhatsApp.
- **P2 · Attendance analytics dashboard** with roll-wise scan timeline.
- **P2 · Full-screen projector reveal** on valid scan for the entry gate.

## Test Reports
- `/app/test_reports/iteration_1.json` … `iteration_5.json`
- Backend suite: `/app/backend/tests/test_frenzy_api.py`

## Credentials
See `/app/memory/test_credentials.md`.
