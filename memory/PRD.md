# Shram Cold Conversation Audit — PRD

## Original Problem Statement
Build a prototype for founders. A standalone single-page web tool that surfaces "cold conversations" from a user's inbox to give a non-user a reason to care before installing Shram. Connect Gmail (read-only) for 60 seconds; the tool scans the last 90 days and returns one number ("You have N conversations that went cold. Here is who."). Below the result: "Shram would have caught all N. Request access." The result IS the product demo. ML-driven, RAG-style reasoning. No signup wall.

## Architecture
- **Backend**: FastAPI + MongoDB. `EMERGENT_LLM_KEY` powers Gemini 3 Flash via `emergentintegrations`.
- **Dataset**: 2,500-row Excel from user is converted to `/app/backend/dataset.json`. Split into a labeled few-shot pool (200) and an "inbox" pool (2,300).
- **ML Pipeline**: On scan, sample 14 inbox threads (3 HIGH / 4 MED / 7 LOW bias for demo); pass 6 balanced labeled few-shot examples to Gemini with strict JSON-only system prompt; parse and merge back with metadata; cold = score ≥ 50.
- **Frontend**: React + Tailwind + shadcn. Single-page 4-stage flow (hero → scanning → results → CTA). Brutalist Swiss high-contrast aesthetic per design_guidelines.json — Clash Display + IBM Plex Mono fonts, no rounded corners, 2px black borders, dramatic 24vw "number reveal" with `hammer-in` animation, terminal-style scanning with streaming green log lines.

## Endpoints
- `GET /api/` — health
- `POST /api/scan` — runs the full Gemini few-shot scoring pipeline and returns cold threads
- `GET /api/scan/{session_id}` — fetches a stored scan
- `POST /api/access/request` — captures email lead { email, session_id?, cold_count? }
- `GET /api/access/requests` — list of leads (founder-facing)
- `GET /api/stats` — aggregate counts (proof of activity for pitch)

## Implemented (2026-04-26)
- 4-segment single-page flow with full data-testid coverage on every interactive element
- Real Gemini 3 Flash few-shot RAG scoring (NOT mocked — actual ML calls)
- Dataset-grounded inbox simulation (skipping real OAuth per user direction; founder pitch demo)
- Email capture + Mongo persistence, success state with personalized confirmation
- Toast notifications, expandable cold-conversation rows showing AI reasoning + Shram suggested action
- Animated terminal scanning stage with progressive stages, streaming logs, live counters

## User Personas
1. **Founder/operator** receiving the live pitch — sees their pain quantified in 5 seconds
2. **Shram team** — uses `/api/access/requests` to see captured leads

## Backlog
- **P1**: Real Gmail OAuth (production) — currently demoed via dataset
- **P1**: Shareable result page (`/r/:session_id`) so founders can forward "I have 7 cold convos" as a hook
- **P2**: Personalized email digest after scan (using captured email)
- **P2**: Tie a per-thread "draft a reply" generation to each cold row (one-click value)
- **P3**: Slack delivery / weekly cadence
