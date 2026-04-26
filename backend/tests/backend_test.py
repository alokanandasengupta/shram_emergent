"""Backend API tests for Shram Cold Conversation Audit."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://conversation-audit.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
def test_root_ok(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    assert "service" in data


# ---------- Stats ----------
def test_stats(session):
    r = session.get(f"{API}/stats")
    assert r.status_code == 200
    d = r.json()
    assert d["dataset_size"] == 2500
    assert d["labeled_pool_size"] == 200
    assert d["inbox_pool_size"] == 2300
    assert "total_scans" in d
    assert "total_access_requests" in d


# ---------- Scan ----------
@pytest.fixture(scope="module")
def scan_result(session):
    r = session.post(f"{API}/scan", timeout=60)
    assert r.status_code == 200, f"scan failed: {r.status_code} {r.text[:300]}"
    return r.json()


def test_scan_response_shape(scan_result):
    d = scan_result
    assert "session_id" in d and len(d["session_id"]) >= 16
    assert d["total_threads_scanned"] >= 10
    assert d["total_threads_scanned"] <= 14
    assert 1 <= d["cold_count"] <= d["total_threads_scanned"]
    assert d["days_window"] == 90
    assert d["scan_meta"]["model"] == "gemini-3-flash-preview"
    assert d["scan_meta"]["few_shot_examples"] == 6
    assert "scanned_at" in d["scan_meta"]


def test_scan_cold_threads_valid(scan_result):
    cold = scan_result["cold_threads"]
    assert isinstance(cold, list)
    assert len(cold) == scan_result["cold_count"]
    # sorted desc
    scores = [t["cold_score_0_100"] for t in cold]
    assert scores == sorted(scores, reverse=True)
    for t in cold:
        assert t["cold_score_0_100"] >= 50
        assert t["risk_tier"] in {"LOW", "MEDIUM", "HIGH"}
        assert isinstance(t["cold_reason"], str) and len(t["cold_reason"]) > 0
        assert "thread_id" in t and t["thread_id"].startswith("THREAD_")
        assert "contact_name" in t


def test_scan_hits_real_gemini(scan_result):
    """Verify Gemini path actually ran by checking backend log."""
    # Check log file for the marker
    log_paths = [
        "/var/log/supervisor/backend.out.log",
        "/var/log/supervisor/backend.err.log",
    ]
    found = False
    for p in log_paths:
        try:
            with open(p, "r") as f:
                content = f.read()
            if "Gemini raw response" in content:
                found = True
                break
        except FileNotFoundError:
            continue
    assert found, "No 'Gemini raw response' log entry found - Gemini path may not have run"


def test_get_scan_by_session(session, scan_result):
    sid = scan_result["session_id"]
    r = session.get(f"{API}/scan/{sid}")
    assert r.status_code == 200
    d = r.json()
    assert d["session_id"] == sid
    # ensure no _id leak
    assert "_id" not in d
    assert d["cold_count"] == scan_result["cold_count"]


def test_get_scan_not_found(session):
    r = session.get(f"{API}/scan/nonexistent-session-id-xyz")
    assert r.status_code == 404


# ---------- Access Request ----------
def test_access_request_valid(session):
    payload = {
        "email": "TEST_founder@example.com",
        "session_id": "test-sess-123",
        "cold_count": 5,
    }
    r = session.post(f"{API}/access/request", json=payload)
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    assert "id" in d and len(d["id"]) >= 16


def test_access_request_invalid_email(session):
    r = session.post(f"{API}/access/request", json={"email": "notanemail"})
    assert r.status_code == 422


# ---------- Draft Reply (NEW) ----------
def test_draft_reply_valid(session, scan_result):
    """Real Gemini-generated draft for a real cold thread in the saved scan."""
    sid = scan_result["session_id"]
    cold = scan_result["cold_threads"]
    if not cold:
        pytest.skip("No cold threads in scan result")
    thread_id = cold[0]["thread_id"]
    r = session.post(f"{API}/draft/{sid}/{thread_id}", timeout=60)
    assert r.status_code == 200, f"draft failed: {r.status_code} {r.text[:300]}"
    d = r.json()
    assert d["thread_id"] == thread_id
    assert isinstance(d["draft"], str)
    assert len(d["draft"]) > 20
    # rough word count under ~200
    assert len(d["draft"].split()) < 220
    # should not contain a code fence
    assert "```" not in d["draft"]


def test_draft_reply_invalid_session(session):
    r = session.post(f"{API}/draft/nonexistent-session-xyz/THREAD_001")
    assert r.status_code == 404
    assert "Scan not found" in r.text


def test_draft_reply_invalid_thread(session, scan_result):
    sid = scan_result["session_id"]
    r = session.post(f"{API}/draft/{sid}/THREAD_does_not_exist_999")
    assert r.status_code == 404
    assert "Thread not found" in r.text


def test_access_requests_list(session):
    # ensure at least one exists
    session.post(f"{API}/access/request", json={"email": "TEST_listcheck@example.com"})
    r = session.get(f"{API}/access/requests")
    assert r.status_code == 200
    d = r.json()
    assert "items" in d and "count" in d
    assert d["count"] >= 1
    emails = [x.get("email") for x in d["items"]]
    assert any("TEST_" in (e or "") for e in emails)
    # no _id leak
    for item in d["items"]:
        assert "_id" not in item
