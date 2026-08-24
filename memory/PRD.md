# Fresher Frenzy Redesign PRD

## Original problem statement
Redesign the uploaded Fresher Frenzy invite and entry pass system with premium holographic visuals, bold typography, motion, responsive layouts, and preserved registration, pass, navigation, and admin flows.

## Architecture decisions
- React single-page interface remains the frontend shell, using the existing protected backend URL.
- FastAPI keeps the `/api` contract for registration, pass lookup, stats, admin login, and gate scanning.
- Visual language uses Unbounded, Space Grotesk, and DM Mono with dark holographic panels, cyan/pink/lime accents, grid motion, reveal transitions, and reduced-motion support.
- Existing event navigation is preserved as Home, Agenda, Join, Pass, Crew, Scanner, and Admin destinations.

## User personas
- Freshers: explore the event, read the invitation, register, and present their QR pass.
- Organizers: review lineup, answer attendee questions, and manage entry verification.
- Gate admin: authenticate, scan pass identifiers, and confirm admission.

## Core requirements (static)
- Preserve the event purpose and content while creating a more premium, interactive visual experience.
- Keep registration, pass lookup, invitation modal, navigation, admin access, and scanning available.
- Responsive behavior for desktop and mobile, accessible controls, visible focus states, and reduced motion.

## What's been implemented
- 2026-02-01: Replaced starter screen with the complete Fresher Frenzy experience and holographic home hero.
- 2026-02-01: Added animated countdown, agenda day switcher, invitation modal, registration form, pass card, crew contacts, admin auth, scanner, and command center.
- 2026-02-01: Added FastAPI endpoints for register, pass lookup, admin login, stats, and authorized scan verification.
- 2026-02-01: Added mobile layout, fixed navigation dock, responsive panels, focus states, and reduced-motion support.

## Prioritized backlog
- P0: Persist registrations and admin sessions in the configured database for multi-instance reliability.
- P1: Add real camera QR decoding and live projector gate display.
- P1: Add admin roster, squad grouping, email outbox, and content editor screens.
- P2: Add downloadable high-resolution pass artwork and share sheet.

## Next tasks
1. Connect the admin command center to roster and squad management.
2. Replace manual scanner input with camera QR scanning.
3. Add persistent storage and production email delivery.