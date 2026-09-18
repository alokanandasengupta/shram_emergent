# Shram Cold Conversation Audit

A live product-pitch demo built solo as an application prototype for
Shram's Founder's Office. The pitch: connect your inbox for 60 seconds,
and the tool surfaces every conversation that's gone cold — one number,
with receipts — before you've signed up for anything. The result **is**
the product demo.

> Built on an AI-generated dummy dataset — no real inbox data is read or
> stored. (Real OAuth inbox scanning was scoped out deliberately per the
> brief; this simulates the scan against a seeded dataset so the ML
> pipeline and UX could be judged on their own merits within the time
> available.)

## How it works

1. **Scan**: samples 14 threads from a seeded "inbox" pool (biased 3
   high-priority / 4 medium / 7 low, for a demo-realistic spread).
2. **Score**: passes 6 balanced few-shot labeled examples plus the sampled
   threads to Gemini 3 Flash with a strict JSON-only system prompt —
   real few-shot RAG scoring, not mocked. A thread scoring ≥50 is "cold."
3. **Reveal**: a single dramatic number, then the list of who — with the
   model's reasoning and a suggested next action per thread.
4. **Convert**: "Shram would have caught all N. Request access" — captures
   an email lead.

Beyond the core audit, the app also runs three live founder-pitch
experiments on the same dataset (message framing A/B, a "dread naming"
priority test, and a personalized AI-generated closing line), each with
live vote tallies — instrumented to give the founders real signal during
the pitch itself, not just a static demo.

Full spec, architecture notes, and a complete build log (v1 → v3.2) are in
[`memory/PRD.md`](memory/PRD.md).

## Stack

**Backend**: FastAPI, MongoDB (Motor), Gemini 3 Flash (via `emergentintegrations`).
**Frontend**: React, Tailwind, shadcn/ui, Radix. Single-page flow: hero →
scanning → results → CTA, plus a shareable read-only results page.

## Running it

```bash
# backend
cd backend && pip install -r requirements.txt
MONGO_URL=... DB_NAME=... EMERGENT_LLM_KEY=... uvicorn server:app --reload

# frontend
cd frontend && yarn install && yarn start
```

## Testing

```bash
cd backend && pip install -r requirements.txt pytest  # minus emergentintegrations, see below
python -m pytest tests/test_server.py -v
```

28 tests covering the prompt-building, the JSON-array parser that guards
against a malformed/prose-wrapped LLM response, the balanced few-shot/inbox
samplers (run against the real committed dataset), and the dread-bucket
classifier. `emergentintegrations` (the Gemini SDK wrapper) is a private
package from the emergent.sh build platform, not on public PyPI — it's
stubbed out in `tests/conftest.py` since it's only used inside the async
Gemini-calling function, which these tests don't exercise. Runs in CI on
every push. `tests/backend_test.py` and `tests/test_experiments.py` are
pre-existing live-integration tests against a deployed instance + real
Gemini API — not run in CI.
