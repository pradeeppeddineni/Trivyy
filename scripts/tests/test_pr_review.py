"""Unit tests for the pure helpers in scripts/pr_review.py.

These cover the logic that runs without network or API access: verdict
detection, diff truncation, the file-content budget, and layer definitions.
Run with: python -m pytest scripts/tests/test_pr_review.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pr_review  # noqa: E402


def test_detect_verdict_request_changes():
    body = "## Summary\n...\n## Verdict: REQUEST CHANGES\n"
    assert pr_review._detect_verdict(body) == "REQUEST_CHANGES"


def test_detect_verdict_approve():
    assert pr_review._detect_verdict("**Verdict:** APPROVE") == "APPROVE"


def test_detect_verdict_defaults_to_comment():
    assert pr_review._detect_verdict("no verdict heading here") == "COMMENT"


def test_detect_verdict_uses_last_heading():
    # An early template echo must not override the real verdict at the bottom.
    body = "## Verdict: APPROVE\n... discussion ...\n## Verdict: REQUEST CHANGES\n"
    assert pr_review._detect_verdict(body) == "REQUEST_CHANGES"


def test_truncate_diff_short_passthrough():
    diff, note = pr_review._truncate_diff("small diff")
    assert diff == "small diff"
    assert note == ""


def test_truncate_diff_long_is_capped():
    big = "x" * (pr_review.MAX_DIFF_CHARS + 100)
    diff, note = pr_review._truncate_diff(big)
    assert len(diff) == pr_review.MAX_DIFF_CHARS
    assert "truncated" in note.lower()


def test_file_contents_block_respects_budget():
    huge = {"a.ts": "y" * (pr_review.MAX_FILE_CONTENT_PER_LAYER + 10), "b.ts": "z" * 100}
    block = pr_review._build_file_contents_block(huge)
    assert "a.ts" in block
    # Second file should be omitted once the budget is exhausted.
    assert "budget exhausted" in block


def test_there_are_exactly_eight_layers_with_unique_ids():
    ids = [layer["id"] for layer in pr_review.LAYERS]
    assert ids == [1, 2, 3, 4, 5, 6, 7, 8]
    assert all(layer["name"] and layer["focus"] for layer in pr_review.LAYERS)
