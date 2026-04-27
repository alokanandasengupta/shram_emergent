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
### v1 — initial prototype
- 4-segment single-page flow with full data-testid coverage on every interactive element
- Real Gemini 3 Flash few-shot RAG scoring (NOT mocked — actual ML calls)
- Dataset-grounded inbox simulation (skipping real OAuth per user direction; founder pitch demo)
- Email capture + Mongo persistence, success state with personalized confirmation
- Toast notifications, expandable cold-conversation rows showing AI reasoning + Shram suggested action
- Animated terminal scanning stage with progressive stages, streaming logs, live counters

### v2 — design rebuild + 2 new features (2026-04-26)
- **Major design pivot**: brutalist Swiss → calm warm cream/pink editorial serif matching shram.ai brand DNA exactly. Cormorant Garamond + Source Serif 4. Pill buttons. Soft tag chips.
- **NEW: Shareable result page** at `/r/:sessionId`. When a founder forwards the link, recipient sees a "A founder shared their cold-conversation audit with you — they have N conversations going cold right now" banner with "Run yours" CTA. Read-only mode hides Draft/Rescan. Document.title updates for inline preview ("8 cold conversations — Shram"). OG/Twitter meta tags added.
- **NEW: Per-row "Draft a reply" button**. Each cold thread, when expanded, has a "Draft a reply" pill that calls `POST /api/draft/{session_id}/{thread_id}` → Gemini generates a contextual, in-voice reply using the thread's actual context (subject, last preview, promise made, days since). Output rendered inline with "Copy draft" pill.
- New `BrowserRouter` setup with routes `/` (MainFlow) and `/r/:sessionId` (SharePageWrapper). Owner stays at `/` after their own scan (full features); only people clicking a shared URL land at `/r/:id` (readOnly).
- Shram crystal SVG mark, About link, and footer matching shram.ai layout.

### v3 — Three new founder-pitch experiments (2026-04-27)
- Dataset: ingested `experiments_dataset.xlsx` (1000 records with `exp01_productivity_frame`, `exp01_anxiety_removal_frame`, `exp02_dread_label`, `quiet_close_sentence`, `stayed_warm_today` columns) → `/app/backend/experiments_dataset.json`.
- **Experiment 01 — The Framing Switch**: side-by-side cards comparing productivity vs anxiety-removal copy of the same notification. User taps "which made you feel something?" → backend records vote → live tally bar at the bottom of each card. Voting kill-condition test for the founders' positioning hypothesis.
- **Experiment 02 — The Dread Naming Test**: 3 cards (one per bucket: investor / contractor / warm_intro) drawn live from dataset. User picks which thread they'd most hate to forget → reveals the dread hierarchy live.
- **Experiment 04 — The Quiet Close**: post-results morning sentence section. If session_id provided, Gemini personalises a one-sentence "relief" headline using the user's actual scanned threads (e.g. "Nikhil is back at the top of your screen after Priya's intro sat silent... You did not lose that one."). Pre-written shareable text plus Copy + Post-on-X buttons; share intents recorded for the bottom-funnel growth metric.
- New aggregate endpoint `GET /api/exp/results` for the founders to review all signals in one place.
- Layout reorganized: Hero → Exp 01 → Exp 02 → Exp 03 (Cold Audit intro + Connect button reused) → [scan flow] → Results + Quiet Close + Request Access.

### v3.1 — Quiet Close PREVIEW on the landing (2026-04-27)
- Founder PLG insight: users should see the WHOLE flywheel (top-of-funnel audit → bottom-of-funnel relief → share → loop back) before committing.
- Added `preview` prop to `QuietClose.jsx`. On the landing page (between Cold Audit Intro and end of page), a preview Quiet Close is rendered with: (a) a sample sentence from the dataset, clearly tagged "a sample from the dataset — not your data, not yet"; (b) a "Closing the loop" copy block; (c) a primary CTA "See your version — run the audit" (data-testid='quiet-close-preview-cta') that triggers the same `startScan` handler.
- The post-audit Quiet Close (after results) keeps the share UI; the preview replaces share with the audit CTA.
- Landing now has TWO conversion surfaces to the audit: Hero's Connect Gmail (top) AND Quiet Close preview's "See your version" (bottom). Both call the same scan flow.

## User Personas
1. **Founder/operator** receiving the live pitch — sees their pain quantified in 5 seconds
2. **Shram team** — uses `/api/access/requests` to see captured leads

## Backlog
- **P1**: Real Gmail OAuth (production) — currently demoed via dataset
- **P1**: Shareable result page (`/r/:session_id`) so founders can forward "I have 7 cold convos" as a hook
- **P2**: Personalized email digest after scan (using captured email)
- **P2**: Tie a per-thread "draft a reply" generation to each cold row (one-click value)
- **P3**: Slack delivery / weekly cadence
