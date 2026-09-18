"""
Tests for the pure logic in server.py: prompt-building, the JSON-array
parser that guards against a malformed/prose-wrapped LLM response, the
balanced few-shot/inbox samplers (run against the real committed dataset,
not a mock), and the dread-bucket classifier.

Scope deliberately excludes the actual Gemini call (_gemini_score) and the
FastAPI route handlers that need a live Mongo connection -- see
conftest.py for why (private SDK not on PyPI, no live DB in CI).
"""
import json

import pytest

from server import (
    _strip_labels,
    _format_example,
    _parse_json_array,
    _sample_examples,
    _sample_inbox,
    _bucket_for_relationship,
    LABELED_POOL,
    INBOX_POOL,
)

SAMPLE_THREAD = {
    "thread_id": "THREAD_0001",
    "contact_name": "Meghna Tiwari",
    "contact_company": "Brand Strategist",
    "relationship_type": "contractor",
    "subject": "Re: Scope change discussion",
    "thread_start_date": "2026-02-09",
    "last_message_date": "2026-04-25",
    "days_since_last_message": 1,
    "last_sender": "them",
    "last_message_preview": "The revised files are ready.",
    "you_owe_reply": True,
    "promise_made": "Review and approve",
    "days_since_promise": 3,
    "total_emails_in_thread": 5,
    "your_emails_in_thread": 2,
    "cold_score_0_100": 72,
    "risk_tier": "HIGH",
    "cold_reason": "Said will review — did not",
    "shram_would_flag": True,
    "shram_suggested_action": "Send approval or explain the holdup",
}


class TestStripLabels:
    def test_removes_ml_label_fields(self):
        stripped = _strip_labels(SAMPLE_THREAD)
        assert "cold_score_0_100" not in stripped
        assert "risk_tier" not in stripped
        assert "shram_would_flag" not in stripped

    def test_keeps_raw_metadata_fields(self):
        stripped = _strip_labels(SAMPLE_THREAD)
        assert stripped["thread_id"] == "THREAD_0001"
        assert stripped["last_sender"] == "them"
        assert stripped["days_since_promise"] == 3

    def test_missing_keys_become_none_not_keyerror(self):
        stripped = _strip_labels({"thread_id": "X"})
        assert stripped["thread_id"] == "X"
        assert stripped["last_sender"] is None


class TestFormatExample:
    def test_produces_input_output_pair_with_no_leaked_labels_in_input(self):
        formatted = _format_example(SAMPLE_THREAD)
        assert formatted.startswith("INPUT:")
        assert "OUTPUT:" in formatted
        input_section = formatted.split("OUTPUT:")[0]
        assert "cold_score_0_100" not in input_section

    def test_output_section_has_the_label_fields(self):
        formatted = _format_example(SAMPLE_THREAD)
        output_section = formatted.split("OUTPUT:")[1]
        parsed = json.loads(output_section.strip())
        assert parsed["cold_score_0_100"] == 72
        assert parsed["risk_tier"] == "HIGH"
        assert parsed["shram_would_flag"] is True

    def test_missing_shram_would_flag_defaults_false(self):
        thread = {**SAMPLE_THREAD}
        del thread["shram_would_flag"]
        formatted = _format_example(thread)
        output_section = json.loads(formatted.split("OUTPUT:")[1].strip())
        assert output_section["shram_would_flag"] is False


class TestParseJsonArray:
    def test_plain_json_array(self):
        result = _parse_json_array('[{"a": 1}, {"a": 2}]')
        assert result == [{"a": 1}, {"a": 2}]

    def test_array_wrapped_in_markdown_code_fence(self):
        text = '```json\n[{"a": 1}]\n```'
        assert _parse_json_array(text) == [{"a": 1}]

    def test_array_wrapped_in_plain_code_fence(self):
        text = '```\n[{"a": 1}]\n```'
        assert _parse_json_array(text) == [{"a": 1}]

    def test_array_with_prose_before_and_after(self):
        # A common real failure mode: the model adds a sentence despite
        # being told not to.
        text = 'Here is the analysis:\n[{"a": 1}]\nLet me know if you need more.'
        assert _parse_json_array(text) == [{"a": 1}]

    def test_no_array_present_raises_value_error(self):
        with pytest.raises(ValueError):
            _parse_json_array("I could not analyze these threads.")

    def test_empty_array(self):
        assert _parse_json_array("[]") == []


class TestBucketForRelationship:
    @pytest.mark.parametrize("raw,expected", [
        ("investor", "investor"),
        ("VC", "investor"),
        ("contractor", "contractor"),
        ("vendor", "contractor"),
        ("Freelancer", "contractor"),
        ("warm_intro", "warm_intro"),
        ("warm_intros", "warm_intro"),
        ("client", "client"),   # unmapped values pass through unchanged
        ("cofounder", "cofounder"),
        (None, "other"),
        ("", "other"),
    ])
    def test_bucket_mapping(self, raw, expected):
        assert _bucket_for_relationship(raw) == expected


class TestSamplers:
    """Run against the real dataset committed in the repo, not a mock."""

    def test_sample_examples_returns_at_most_k(self):
        result = _sample_examples(k=6)
        assert len(result) <= 6

    def test_sample_examples_only_draws_from_labeled_pool(self):
        labeled_ids = {t["thread_id"] for t in LABELED_POOL}
        result = _sample_examples(k=6)
        assert all(t["thread_id"] in labeled_ids for t in result)

    def test_sample_inbox_returns_at_most_n(self):
        result = _sample_inbox(n=14)
        assert len(result) <= 14

    def test_sample_inbox_only_draws_from_inbox_pool(self):
        inbox_ids = {t["thread_id"] for t in INBOX_POOL}
        result = _sample_inbox(n=14)
        assert all(t["thread_id"] in inbox_ids for t in result)

    def test_dataset_pools_are_non_empty(self):
        # Guards against a future dataset.json edit silently breaking the
        # 200/2300 label/inbox split the app assumes.
        assert len(LABELED_POOL) > 0
        assert len(INBOX_POOL) > 0
