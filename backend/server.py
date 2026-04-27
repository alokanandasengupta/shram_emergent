"""
Shram Cold Conversation Audit - Backend
Analyzes email thread metadata using Gemini with few-shot RAG-like reasoning
to detect "cold" conversations that need attention.
"""
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import random
import uuid
import re
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# Load datasets once at startup
DATASET_PATH = ROOT_DIR / 'dataset.json'
with open(DATASET_PATH) as f:
    DATASET: List[Dict[str, Any]] = json.load(f)

EXP_DATASET_PATH = ROOT_DIR / 'experiments_dataset.json'
with open(EXP_DATASET_PATH) as f:
    EXP_DATASET: List[Dict[str, Any]] = json.load(f)

# Pools for the experiments
FRAMING_POOL = [
    r for r in EXP_DATASET
    if r.get("exp01_productivity_frame") and r.get("exp01_anxiety_removal_frame")
]

DREAD_BUCKETS: Dict[str, List[Dict[str, Any]]] = {}
for r in EXP_DATASET:
    rel = r.get("relationship_type")
    if rel:
        DREAD_BUCKETS.setdefault(rel, []).append(r)

QUIET_CLOSE_POOL = [
    r for r in EXP_DATASET
    if r.get("stayed_warm_today") in (True, "True", 1) and r.get("quiet_close_sentence")
]

# Split: pool of ~30 labeled examples for few-shot, rest as "user inbox" pool
random.seed(42)
_indexed = list(enumerate(DATASET))
random.shuffle(_indexed)

# Use first 200 as labeled few-shot pool (sample from these per-scan), rest as inbox pool
LABELED_POOL = [r for _, r in _indexed[:200]]
INBOX_POOL = [r for _, r in _indexed[200:]]

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Shram Cold Audit API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class ScanThread(BaseModel):
    thread_id: str
    contact_name: str
    contact_company: str
    relationship_type: str
    subject: str
    thread_start_date: Optional[str] = None
    last_message_date: Optional[str] = None
    days_since_last_message: int
    last_sender: str
    last_message_preview: str
    you_owe_reply: Optional[bool] = None
    promise_made: Optional[str] = None
    days_since_promise: Optional[float] = None
    total_emails_in_thread: int
    your_emails_in_thread: int
    cold_score_0_100: int
    risk_tier: str
    cold_reason: str
    shram_would_flag: Optional[bool] = None
    shram_suggested_action: Optional[str] = None


class ScanResponse(BaseModel):
    session_id: str
    total_threads_scanned: int
    cold_count: int
    cold_threads: List[ScanThread]
    days_window: int = 90
    scan_meta: Dict[str, Any]


class AccessRequest(BaseModel):
    email: EmailStr
    session_id: Optional[str] = None
    cold_count: Optional[int] = None


# ---------- Helpers ----------
def _strip_labels(thread: Dict[str, Any]) -> Dict[str, Any]:
    """Remove ML-labeled fields so Gemini truly analyzes from scratch."""
    keep = [
        "thread_id", "contact_name", "contact_company", "relationship_type",
        "subject", "thread_start_date", "last_message_date",
        "days_since_last_message", "last_sender", "last_message_preview",
        "you_owe_reply", "promise_made", "days_since_promise",
        "total_emails_in_thread", "your_emails_in_thread"
    ]
    return {k: thread.get(k) for k in keep}


def _format_example(thread: Dict[str, Any]) -> str:
    """Format a labeled thread as a few-shot example."""
    inp = _strip_labels(thread)
    out = {
        "thread_id": thread["thread_id"],
        "cold_score_0_100": thread["cold_score_0_100"],
        "risk_tier": thread["risk_tier"],
        "cold_reason": thread["cold_reason"],
        "shram_would_flag": bool(thread.get("shram_would_flag")) if thread.get("shram_would_flag") is not None else False,
        "shram_suggested_action": thread.get("shram_suggested_action"),
    }
    return f"INPUT:\n{json.dumps(inp, default=str)}\nOUTPUT:\n{json.dumps(out, default=str)}"


def _build_system_prompt() -> str:
    return (
        "You are Shram's Cold Conversation Detection Brain. You receive metadata "
        "from email threads and must output a strict JSON array, one object per "
        "input thread, with these exact keys:\n"
        '  thread_id (str), cold_score_0_100 (int 0-100), '
        'risk_tier ("LOW"|"MEDIUM"|"HIGH"), cold_reason (short string), '
        'shram_would_flag (bool), shram_suggested_action (string or null).\n\n'
        "Reasoning rules (RAG-style, learned from labeled examples):\n"
        "- A conversation is COLD when the user is the bottleneck (owes a reply) "
        "or when the other party is waiting and momentum has died.\n"
        "- Higher cold_score for: longer days_since_last_message, unfulfilled "
        "promises (high days_since_promise), last_sender='them' with no reply, "
        "investor/partner relationships (higher stakes).\n"
        "- Lower cold_score for: very recent activity, last_sender='you' (you "
        "already replied), small total_emails_in_thread (just started).\n"
        "- risk_tier mapping: 0-39=LOW, 40-69=MEDIUM, 70-100=HIGH.\n"
        "- cold_reason must be a concise human-readable phrase like "
        "'Said will send link \u2014 did not' or 'Calendar link never sent'.\n"
        "- shram_would_flag=true when the thread is ACTIONABLE (cold_score >= 50 "
        "AND last_sender='them' OR an unfulfilled promise exists).\n"
        "- shram_suggested_action: short imperative if flagged, else null.\n\n"
        "Output ONLY a JSON array. No prose, no markdown, no code fences."
    )


def _build_user_prompt(examples: List[Dict[str, Any]], to_score: List[Dict[str, Any]]) -> str:
    parts = ["Here are calibration examples (labeled training data):\n"]
    for ex in examples:
        parts.append(_format_example(ex))
        parts.append("---")
    parts.append("\nNow analyze these new threads and return a JSON array of "
                 "scored objects, one per thread, in the same order:\n")
    stripped = [_strip_labels(t) for t in to_score]
    parts.append(json.dumps(stripped, default=str))
    return "\n".join(parts)


def _parse_json_array(text: str) -> List[Dict[str, Any]]:
    """Robustly extract a JSON array from a model response."""
    text = text.strip()
    # strip code fences if present
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    # find first [ and last ]
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON array in model output: {text[:200]}")
    return json.loads(text[start:end + 1])


def _sample_examples(k: int = 6) -> List[Dict[str, Any]]:
    """Pick a balanced few-shot sample across LOW/MEDIUM/HIGH tiers."""
    by_tier = {"HIGH": [], "MEDIUM": [], "LOW": []}
    for t in LABELED_POOL:
        tier = t.get("risk_tier")
        if tier in by_tier:
            by_tier[tier].append(t)
    chosen = []
    per_tier = max(1, k // 3)
    for tier in ["HIGH", "MEDIUM", "LOW"]:
        pool = by_tier[tier]
        chosen.extend(random.sample(pool, min(per_tier, len(pool))))
    random.shuffle(chosen)
    return chosen[:k]


def _sample_inbox(n: int = 14) -> List[Dict[str, Any]]:
    """Pick a realistic mix of threads from the 'inbox' pool — biased so a few are cold."""
    by_tier = {"HIGH": [], "MEDIUM": [], "LOW": []}
    for t in INBOX_POOL:
        tier = t.get("risk_tier")
        if tier in by_tier:
            by_tier[tier].append(t)
    # realistic mix: 3 HIGH, 4 MEDIUM, 7 LOW (biased so the demo always reveals cold ones)
    chosen = []
    chosen.extend(random.sample(by_tier["HIGH"], min(3, len(by_tier["HIGH"]))))
    chosen.extend(random.sample(by_tier["MEDIUM"], min(4, len(by_tier["MEDIUM"]))))
    chosen.extend(random.sample(by_tier["LOW"], min(7, len(by_tier["LOW"]))))
    random.shuffle(chosen)
    return chosen[:n]


async def _gemini_score(threads: List[Dict[str, Any]], examples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Run Gemini few-shot scoring."""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"cold-scan-{uuid.uuid4()}",
        system_message=_build_system_prompt(),
    ).with_model("gemini", "gemini-3-flash-preview")

    user_prompt = _build_user_prompt(examples, threads)
    raw = await chat.send_message(UserMessage(text=user_prompt))
    logger.info(f"Gemini raw response (first 300 chars): {raw[:300]}")
    return _parse_json_array(raw)


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"service": "Shram Cold Audit", "status": "ok"}


@api_router.post("/scan", response_model=ScanResponse)
async def run_scan():
    """
    Simulates a Gmail scan. Samples ~14 threads from the inbox pool, runs them
    through Gemini with few-shot examples, and returns cold conversations.
    """
    session_id = str(uuid.uuid4())
    inbox = _sample_inbox(14)
    examples = _sample_examples(6)

    try:
        scored = await _gemini_score(inbox, examples)
    except Exception as e:
        logger.error(f"Gemini scoring failed: {e}", exc_info=True)
        # graceful fallback to dataset's own labels (still demo-able)
        scored = [
            {
                "thread_id": t["thread_id"],
                "cold_score_0_100": t["cold_score_0_100"],
                "risk_tier": t["risk_tier"],
                "cold_reason": t["cold_reason"],
                "shram_would_flag": bool(t.get("shram_would_flag")),
                "shram_suggested_action": t.get("shram_suggested_action"),
            }
            for t in inbox
        ]

    # merge scored data back with thread metadata
    by_id = {t["thread_id"]: t for t in inbox}
    merged: List[ScanThread] = []
    for s in scored:
        tid = s.get("thread_id")
        if tid not in by_id:
            continue
        base = by_id[tid]
        merged.append(ScanThread(
            **{k: base.get(k) for k in [
                "thread_id", "contact_name", "contact_company", "relationship_type",
                "subject", "thread_start_date", "last_message_date",
                "days_since_last_message", "last_sender", "last_message_preview",
                "you_owe_reply", "promise_made", "days_since_promise",
                "total_emails_in_thread", "your_emails_in_thread",
            ]},
            cold_score_0_100=int(s.get("cold_score_0_100", 0)),
            risk_tier=str(s.get("risk_tier", "LOW")).upper(),
            cold_reason=str(s.get("cold_reason", "")),
            shram_would_flag=bool(s.get("shram_would_flag", False)),
            shram_suggested_action=s.get("shram_suggested_action"),
        ))

    # cold = score >= 50 (MEDIUM+HIGH per tier mapping)
    cold = [t for t in merged if t.cold_score_0_100 >= 50]
    cold.sort(key=lambda t: t.cold_score_0_100, reverse=True)

    response = ScanResponse(
        session_id=session_id,
        total_threads_scanned=len(merged),
        cold_count=len(cold),
        cold_threads=cold,
        days_window=90,
        scan_meta={
            "model": "gemini-3-flash-preview",
            "few_shot_examples": len(examples),
            "scanned_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    # persist
    doc = response.model_dump()
    await db.scans.insert_one(doc)

    return response


@api_router.get("/scan/{session_id}", response_model=ScanResponse)
async def get_scan(session_id: str):
    doc = await db.scans.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    return ScanResponse(**doc)


@api_router.post("/access/request")
async def request_access(payload: AccessRequest):
    doc = {
        "id": str(uuid.uuid4()),
        "email": payload.email,
        "session_id": payload.session_id,
        "cold_count": payload.cold_count,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.access_requests.insert_one(doc)
    doc.pop("_id", None)
    return {"ok": True, "id": doc["id"]}


@api_router.get("/access/requests")
async def list_access_requests(limit: int = 50):
    items = await db.access_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"items": items, "count": len(items)}


class DraftReply(BaseModel):
    draft: str
    thread_id: str


@api_router.post("/draft/{session_id}/{thread_id}", response_model=DraftReply)
async def draft_reply(session_id: str, thread_id: str):
    """Generate a contextual draft reply for one cold thread using Gemini."""
    scan = await db.scans.find_one({"session_id": session_id}, {"_id": 0})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    thread = next(
        (t for t in scan.get("cold_threads", []) if t.get("thread_id") == thread_id),
        None,
    )
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found in scan")

    system_msg = (
        "You are Shram drafting a short, warm, in-context follow-up reply for a "
        "founder. Voice: human, calm, no apology spam, no salesy language. "
        "Keep it under 90 words. Reference the specific context of the thread. "
        "Output ONLY the email body text — no subject line, no signature placeholders."
    )

    context = (
        f"Contact: {thread['contact_name']} ({thread['contact_company']}, "
        f"{thread['relationship_type']})\n"
        f"Subject: {thread['subject']}\n"
        f"Days since last message: {thread['days_since_last_message']}\n"
        f"Last sender: {thread['last_sender']}\n"
        f"Last message preview: \"{thread['last_message_preview']}\"\n"
        f"Why it went cold: {thread['cold_reason']}\n"
        f"Promise made (if any): {thread.get('promise_made') or 'none'}\n\n"
        "Draft a short, specific reply that closes the loop. Be warm but direct."
    )

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"draft-{session_id}-{thread_id}",
            system_message=system_msg,
        ).with_model("gemini", "gemini-3-flash-preview")
        draft = (await chat.send_message(UserMessage(text=context))).strip()
        # strip code fences if any
        if draft.startswith("```"):
            draft = re.sub(r"^```\w*\n?", "", draft)
            draft = re.sub(r"\n?```$", "", draft).strip()
    except Exception as e:
        logger.error(f"Draft generation failed: {e}", exc_info=True)
        draft = (
            f"Hi {thread['contact_name'].split()[0]},\n\n"
            "Apologies for the silence. Picking this back up — "
            f"{thread.get('promise_made') or 'closing the loop on this'}. "
            "Sending more this week.\n\nThanks for your patience."
        )

    return DraftReply(draft=draft, thread_id=thread_id)


@api_router.get("/stats")
async def stats():
    """Aggregate stats useful for the founder pitch (proof of activity)."""
    total_scans = await db.scans.count_documents({})
    total_requests = await db.access_requests.count_documents({})
    return {
        "total_scans": total_scans,
        "total_access_requests": total_requests,
        "dataset_size": len(DATASET),
        "labeled_pool_size": len(LABELED_POOL),
        "inbox_pool_size": len(INBOX_POOL),
    }


# =====================================================================
# EXPERIMENTS
# =====================================================================

class FramingSample(BaseModel):
    pair_id: str
    productivity: str
    anxiety_removal: str
    contact_name: str
    contact_company: Optional[str] = None
    relationship_type: Optional[str] = None


class FramingVote(BaseModel):
    choice: str  # "A" (productivity) or "B" (anxiety_removal)
    pair_id: Optional[str] = None
    voter_label: Optional[str] = None  # e.g., "jay", "ojasvika", or anonymous


class DreadCard(BaseModel):
    bucket: str  # e.g. "investor", "contractor", "warm_intro"
    contact_name: str
    contact_company: Optional[str] = None
    subject: str
    last_message_preview: str
    days_since_last_message: int
    dread_label: str


class DreadSample(BaseModel):
    sample_id: str
    cards: List[DreadCard]


class DreadVote(BaseModel):
    bucket: str
    sample_id: Optional[str] = None
    voter_label: Optional[str] = None


class QuietCloseRequest(BaseModel):
    session_id: Optional[str] = None
    contact_hint: Optional[str] = None


class QuietCloseResponse(BaseModel):
    sentence: str
    share_text: str
    source: str  # "gemini" | "dataset"


class ShareIntent(BaseModel):
    sentence: str
    session_id: Optional[str] = None
    channel: Optional[str] = None  # "copy" | "twitter" | "slack" | etc.


# ----- helpers -----
def _bucket_for_relationship(rel: str) -> str:
    """Map raw relationship_type to a coarser dread bucket the experiment cares about."""
    if not rel:
        return "other"
    rel = str(rel).lower().strip()
    if rel in ("investor", "vc"):
        return "investor"
    if rel in ("contractor", "vendor", "freelancer"):
        return "contractor"
    if rel in ("warm_intro", "warm_intros"):
        return "warm_intro"
    return rel  # client, partner, team, cofounder, recruiter etc.


# ----- framing -----
@api_router.get("/exp/framing/sample", response_model=FramingSample)
async def get_framing_sample():
    if not FRAMING_POOL:
        raise HTTPException(status_code=500, detail="No framing pairs available")
    r = random.choice(FRAMING_POOL)
    return FramingSample(
        pair_id=str(r["thread_id"]),
        productivity=str(r["exp01_productivity_frame"]),
        anxiety_removal=str(r["exp01_anxiety_removal_frame"]),
        contact_name=str(r.get("contact_name") or ""),
        contact_company=r.get("contact_company"),
        relationship_type=r.get("relationship_type"),
    )


@api_router.post("/exp/framing")
async def vote_framing(payload: FramingVote):
    if payload.choice not in ("A", "B"):
        raise HTTPException(status_code=400, detail="choice must be 'A' or 'B'")
    doc = {
        "id": str(uuid.uuid4()),
        "choice": payload.choice,
        "pair_id": payload.pair_id,
        "voter_label": payload.voter_label,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.exp_framing_votes.insert_one(doc)
    a = await db.exp_framing_votes.count_documents({"choice": "A"})
    b = await db.exp_framing_votes.count_documents({"choice": "B"})
    return {
        "ok": True,
        "your_choice": payload.choice,
        "tally": {"A": a, "B": b, "total": a + b},
    }


@api_router.get("/exp/framing/tally")
async def framing_tally():
    a = await db.exp_framing_votes.count_documents({"choice": "A"})
    b = await db.exp_framing_votes.count_documents({"choice": "B"})
    return {"A": a, "B": b, "total": a + b}


# ----- dread -----
@api_router.get("/exp/dread/sample", response_model=DreadSample)
async def get_dread_sample():
    """Return one card per priority bucket: investor, contractor, warm_intro."""
    sample_id = str(uuid.uuid4())
    wanted = ["investor", "contractor", "warm_intro"]
    cards: List[DreadCard] = []
    for w in wanted:
        pool = DREAD_BUCKETS.get(w, [])
        if not pool:
            continue
        r = random.choice(pool)
        cards.append(DreadCard(
            bucket=w,
            contact_name=str(r.get("contact_name") or ""),
            contact_company=r.get("contact_company"),
            subject=str(r.get("subject_or_topic") or r.get("thread_label") or ""),
            last_message_preview=str(r.get("last_message_preview") or ""),
            days_since_last_message=int(r.get("days_since_last_message") or 0),
            dread_label=str(r.get("exp02_dread_label") or w),
        ))
    return DreadSample(sample_id=sample_id, cards=cards)


@api_router.post("/exp/dread")
async def vote_dread(payload: DreadVote):
    if payload.bucket not in ("investor", "contractor", "warm_intro"):
        raise HTTPException(status_code=400, detail="invalid bucket")
    doc = {
        "id": str(uuid.uuid4()),
        "bucket": payload.bucket,
        "sample_id": payload.sample_id,
        "voter_label": payload.voter_label,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.exp_dread_votes.insert_one(doc)
    tally = {}
    for k in ("investor", "contractor", "warm_intro"):
        tally[k] = await db.exp_dread_votes.count_documents({"bucket": k})
    tally["total"] = sum(tally.values())
    return {"ok": True, "your_choice": payload.bucket, "tally": tally}


@api_router.get("/exp/dread/tally")
async def dread_tally():
    tally = {}
    for k in ("investor", "contractor", "warm_intro"):
        tally[k] = await db.exp_dread_votes.count_documents({"bucket": k})
    tally["total"] = sum(tally.values())
    return tally


# ----- quiet close -----
@api_router.post("/exp/quiet-close", response_model=QuietCloseResponse)
async def quiet_close(payload: QuietCloseRequest):
    """
    Generate the morning Quiet Close sentence. If a scan session is provided,
    use Gemini to draft a personalized one; otherwise pick from the dataset's
    pre-written pool.
    """
    sentence: Optional[str] = None
    source = "dataset"

    if payload.session_id:
        scan = await db.scans.find_one({"session_id": payload.session_id}, {"_id": 0})
        if scan and scan.get("cold_threads"):
            highest = sorted(
                scan["cold_threads"], key=lambda t: t.get("cold_score_0_100", 0)
            )[0]  # pick the LEAST cold (closest to "warm")
            try:
                chat = LlmChat(
                    api_key=EMERGENT_LLM_KEY,
                    session_id=f"quiet-close-{payload.session_id}",
                    system_message=(
                        "You write Shram's 'Quiet Close' — a single warm sentence "
                        "that appears the morning after Shram saved a thread. Voice: "
                        "calm, specific, one sentence, present tense. Never use "
                        "exclamation marks. Reference the contact by first name. "
                        "End with a 5-7 word affirmation like 'You did not lose that "
                        "one.' or 'Nothing slipped.' or 'You caught it.' Output ONLY "
                        "the sentence. No quotes, no preface."
                    ),
                ).with_model("gemini", "gemini-3-flash-preview")
                ctx = (
                    f"Contact: {highest['contact_name']} "
                    f"({highest.get('contact_company','')}, "
                    f"{highest.get('relationship_type','')}). "
                    f"Subject: {highest['subject']}. "
                    f"Why it nearly went cold: {highest['cold_reason']}. "
                    "Now imagine Shram caught it overnight. Write the morning sentence."
                )
                sentence = (await chat.send_message(UserMessage(text=ctx))).strip().strip('"')
                source = "gemini"
            except Exception as e:
                logger.error(f"Quiet close Gemini failed: {e}", exc_info=True)
                sentence = None

    if not sentence:
        if QUIET_CLOSE_POOL:
            sentence = str(random.choice(QUIET_CLOSE_POOL)["quiet_close_sentence"])
        else:
            sentence = "A thread that mattered stayed warm today. You did not lose that one."

    share_text = f"Started my day with this from Shram. Worth trying.\n\n— {sentence}"
    return QuietCloseResponse(sentence=sentence, share_text=share_text, source=source)


@api_router.post("/exp/quiet-close/share")
async def record_quiet_close_share(payload: ShareIntent):
    doc = {
        "id": str(uuid.uuid4()),
        "sentence": payload.sentence,
        "session_id": payload.session_id,
        "channel": payload.channel or "copy",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.exp_quiet_close_shares.insert_one(doc)
    total = await db.exp_quiet_close_shares.count_documents({})
    return {"ok": True, "total_shares": total}


@api_router.get("/exp/results")
async def experiments_results():
    """Aggregate experiments results — what the founders see when they review."""
    framing_a = await db.exp_framing_votes.count_documents({"choice": "A"})
    framing_b = await db.exp_framing_votes.count_documents({"choice": "B"})
    dread = {}
    for k in ("investor", "contractor", "warm_intro"):
        dread[k] = await db.exp_dread_votes.count_documents({"bucket": k})
    quiet_shares = await db.exp_quiet_close_shares.count_documents({})
    return {
        "exp01_framing": {
            "A_productivity": framing_a,
            "B_anxiety_removal": framing_b,
            "total": framing_a + framing_b,
        },
        "exp02_dread": {**dread, "total": sum(dread.values())},
        "exp04_quiet_close_shares": quiet_shares,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
