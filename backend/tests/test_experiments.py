"""Backend tests for Iteration 3 experiments: framing, dread, quiet-close, results."""
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


# ---------- Framing ----------
def test_framing_sample_shape(session):
    r = session.get(f"{API}/exp/framing/sample")
    assert r.status_code == 200
    d = r.json()
    for k in ["pair_id", "productivity", "anxiety_removal", "contact_name"]:
        assert k in d, f"missing field: {k}"
    assert isinstance(d["productivity"], str) and len(d["productivity"]) > 0
    assert isinstance(d["anxiety_removal"], str) and len(d["anxiety_removal"]) > 0
    assert isinstance(d["pair_id"], str) and len(d["pair_id"]) > 0


def test_framing_vote_A(session):
    before = session.get(f"{API}/exp/framing/tally").json()
    r = session.post(f"{API}/exp/framing", json={"choice": "A", "voter_label": "TEST_pytest"})
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    assert d["your_choice"] == "A"
    assert d["tally"]["A"] == before["A"] + 1
    assert d["tally"]["total"] == before["total"] + 1


def test_framing_vote_B(session):
    before = session.get(f"{API}/exp/framing/tally").json()
    r = session.post(f"{API}/exp/framing", json={"choice": "B", "voter_label": "TEST_pytest"})
    assert r.status_code == 200
    d = r.json()
    assert d["your_choice"] == "B"
    assert d["tally"]["B"] == before["B"] + 1


def test_framing_vote_invalid(session):
    r = session.post(f"{API}/exp/framing", json={"choice": "X"})
    assert r.status_code == 400


def test_framing_tally(session):
    r = session.get(f"{API}/exp/framing/tally")
    assert r.status_code == 200
    d = r.json()
    for k in ("A", "B", "total"):
        assert k in d
        assert isinstance(d[k], int)
    assert d["total"] == d["A"] + d["B"]


# ---------- Dread ----------
def test_dread_sample_three_buckets(session):
    r = session.get(f"{API}/exp/dread/sample")
    assert r.status_code == 200
    d = r.json()
    assert "sample_id" in d and "cards" in d
    assert len(d["cards"]) == 3, f"expected exactly 3 cards, got {len(d['cards'])}"
    buckets = [c["bucket"] for c in d["cards"]]
    assert set(buckets) == {"investor", "contractor", "warm_intro"}, f"buckets={buckets}"
    for c in d["cards"]:
        for k in ["bucket", "contact_name", "subject", "last_message_preview", "days_since_last_message", "dread_label"]:
            assert k in c, f"missing field {k} in card"
        assert isinstance(c["days_since_last_message"], int)


def test_dread_vote_valid(session):
    before = session.get(f"{API}/exp/dread/tally").json()
    r = session.post(f"{API}/exp/dread", json={"bucket": "investor", "voter_label": "TEST_pytest"})
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    assert d["your_choice"] == "investor"
    assert d["tally"]["investor"] == before["investor"] + 1


def test_dread_vote_invalid(session):
    r = session.post(f"{API}/exp/dread", json={"bucket": "random_bucket"})
    assert r.status_code == 400


def test_dread_tally(session):
    r = session.get(f"{API}/exp/dread/tally")
    assert r.status_code == 200
    d = r.json()
    for k in ("investor", "contractor", "warm_intro", "total"):
        assert k in d
    assert d["total"] == d["investor"] + d["contractor"] + d["warm_intro"]


# ---------- Quiet Close ----------
def test_quiet_close_dataset_path(session):
    r = session.post(f"{API}/exp/quiet-close", json={})
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d["sentence"], str) and len(d["sentence"]) > 0
    assert d["source"] == "dataset"
    assert d["share_text"].startswith("Started my day with this from Shram. Worth trying.")
    assert d["sentence"] in d["share_text"]


def test_quiet_close_with_session_id_gemini(session):
    # First create a real scan
    scan_r = session.post(f"{API}/scan", timeout=90)
    assert scan_r.status_code == 200
    sid = scan_r.json()["session_id"]
    contact_names = [t["contact_name"] for t in scan_r.json()["cold_threads"]]
    # call quiet-close with session_id
    r = session.post(f"{API}/exp/quiet-close", json={"session_id": sid}, timeout=60)
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d["sentence"], str) and len(d["sentence"]) > 0
    assert d["source"] in ("gemini", "dataset")  # gemini preferred, but fallback OK
    assert d["share_text"].startswith("Started my day with this from Shram. Worth trying.")
    return d, contact_names


def test_quiet_close_share_record(session):
    r = session.post(f"{API}/exp/quiet-close/share", json={
        "sentence": "TEST_quiet close share sample sentence.",
        "channel": "copy",
    })
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    assert isinstance(d["total_shares"], int)
    assert d["total_shares"] >= 1


# ---------- Aggregate ----------
def test_experiments_results(session):
    r = session.get(f"{API}/exp/results")
    assert r.status_code == 200
    d = r.json()
    assert "exp01_framing" in d
    assert "exp02_dread" in d
    assert "exp04_quiet_close_shares" in d
    fr = d["exp01_framing"]
    for k in ("A_productivity", "B_anxiety_removal", "total"):
        assert k in fr
    assert fr["total"] == fr["A_productivity"] + fr["B_anxiety_removal"]
    dr = d["exp02_dread"]
    for k in ("investor", "contractor", "warm_intro", "total"):
        assert k in dr
    assert isinstance(d["exp04_quiet_close_shares"], int)
