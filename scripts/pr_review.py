#!/usr/bin/env python3
"""
Trivyy PR Review Engine -- 8-layer parallel code review powered by Anthropic Claude.

Adapted from the amida-torqe reviewer, trimmed to a single-pass review (no
iterative tracking, no graph layer). Runs 8 independent review layers in
parallel (one API call each), then aggregates findings into one structured
review comment, picks a verdict, and posts it as a GitHub PR review.

Each layer receives:
  - Its specific focus area and severity rubric
  - Full file contents for all changed files (not just the diff), as context
  - The relevant project rules (rules.md and/or the feature spec)

Usage:
    python scripts/pr_review.py                    # In GitHub Actions
    python scripts/pr_review.py --dry-run --pr 1   # Local testing, no posting
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path

try:
    import anthropic
except ImportError:
    anthropic = None  # type: ignore[assignment]


# --- Layer definitions ------------------------------------------------------
# Eight independent review layers, tailored to Trivyy's stack
# (Node + Express + TypeScript / Postgres / React) and the SHALL rule IDs in
# rules.md. `rules` lists files to include as context for that layer.

RULES = "rules.md"
SPEC = ".specify/trivia-app-spec.md"

LAYERS = [
    {
        "id": 1,
        "name": "Functional Correctness & Code Quality",
        "focus": (
            "Logic errors, dead code, repository hygiene. Check for: off-by-one, "
            "wrong comparisons, inverted conditions, race conditions, unhandled "
            "edge cases (null/undefined, empty arrays, boundary values), async "
            "correctness (missing await, unhandled promise rejection), dead code "
            "(unused exports, orphaned imports), functions over 50 lines or files "
            "over 800 (CODE-4), nesting deeper than 4 levels (CODE-5), and missing "
            "error handling on I/O (CODE-6)."
        ),
        "rules": [],
    },
    {
        "id": 2,
        "name": "Security",
        "focus": (
            "OWASP Top 10 and Trivyy's security rules (SEC-*). Check: no hardcoded "
            "secrets (SEC-1) -- secrets only from env; parameterized SQL, never "
            "string-interpolated queries; nicknames treated as untrusted input, "
            "length-limited and filtered (SEC-5); admin routes guarded at the API "
            "layer, not just the UI (SEC-2); session cookies httpOnly/sameSite; no "
            "PII beyond nicknames in logs (SEC-6); duel game codes single-purpose "
            "(SEC-4); no stack traces / SQL / file paths leaked in errors (API-3)."
        ),
        "rules": [RULES],
    },
    {
        "id": 3,
        "name": "Backend Standards",
        "focus": (
            "Express + TypeScript patterns. Check: thin route handlers, business "
            "logic in a service layer (ARC-2); scoring/game-state logic kept pure "
            "with no I/O (ARC-1); all request/response bodies validated and typed "
            "with zod, never untyped objects (CODE-2); config from env only "
            "(CODE-3); explicit types on public functions (CODE-1); structured JSON "
            "logging via the logger, never console.log in committed code (OBS-1); "
            "each log line carries a game id where relevant (OBS-2)."
        ),
        "rules": [RULES],
    },
    {
        "id": 4,
        "name": "Frontend Standards",
        "focus": (
            "React + TypeScript patterns. Check: no `any` types; every screen "
            "defines explicit loading, empty, error, and success states (ARC-4); UI "
            "is built from the shared component library and design tokens -- no raw "
            "hard-coded style values in components (ARC-3); basic accessibility "
            "(labels, roles, keyboard); no secrets or inline credentials in frontend "
            "code (CODE-7)."
        ),
        "rules": [RULES],
    },
    {
        "id": 5,
        "name": "Test Quality",
        "focus": (
            "Test-driven development and coverage. Flag new logic with no tests. "
            "Check: tests written with the code (TEST-1); total coverage stays >= 80% "
            "(TEST-2); scoring logic has unit tests including correct, wrong, "
            "unanswered, and tie cases (TEST-3); endpoints have supertest integration "
            "tests (API-4); critical flows (solo game, duel join, answer, result) "
            "have Playwright tests (TEST-4); meaningful assertions, correct mocks, no "
            "real network/DB in unit tests."
        ),
        "rules": [RULES],
    },
    {
        "id": 6,
        "name": "Database Standards",
        "focus": (
            "Postgres conventions. Check: schema changes ONLY via versioned "
            "migrations, never hand-edited schema (DB-2); snake_case tables and "
            "columns (DB-3); indexes on lookup fields incl. the duel game_code, no "
            "N+1 patterns (DB-4); questions soft-deleted via a status flag, never "
            "hard-deleted (DB-6); imported questions keep their source and OpenTDB "
            "attribution (DB-7); game lifecycle events written to the events table "
            "(DB-5); parameterized queries only."
        ),
        "rules": [RULES, SPEC],
    },
    {
        "id": 7,
        "name": "API Contract Consistency",
        "focus": (
            "Frontend-backend contract. Check: every frontend API call has a "
            "matching backend route; TypeScript response types match the zod schemas "
            "(field names, types, optionality); new endpoints appear in the OpenAPI "
            "document (API-1); new environment variables are documented in "
            ".env.example (REPO-5); errors return the clear JSON shape (API-3)."
        ),
        "rules": [RULES, SPEC],
    },
    {
        "id": 8,
        "name": "Trivia Domain Rules",
        "focus": (
            "Game correctness against the spec. Check: a duel's question set is "
            "locked at creation and served identically to both players (API-6); "
            "scoring matches spec 4.3 (correct = +1, wrong or unanswered = 0, higher "
            "total wins, equal totals are a draw); turn-based match state is persisted "
            "after every answer so players need not be online together (API-5); only "
            "two auth roles -- nickname player and single admin (SEC-2); players need "
            "no account, identified by nickname + session cookie (SEC-3)."
        ),
        "rules": [SPEC, RULES],
    },
]


# --- Constants --------------------------------------------------------------

MARKER_RE = re.compile(r"<!-- trivyy-pr-review:v(\d+):([a-f0-9]+) -->")
_FAILED_MARKERS = ("PR Review Failed", "encountered an error")

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
LAYER_MAX_TOKENS = 4096
AGGREGATOR_MAX_TOKENS = 8192
MAX_DIFF_CHARS = 300_000
MAX_FILE_CONTENT_PER_LAYER = 150_000


def _is_failed_review(body: str) -> bool:
    return any(m in body for m in _FAILED_MARKERS)


# --- Helpers ----------------------------------------------------------------


def gh(*args, check=True):
    """Run the gh CLI and return stdout (stripped)."""
    proc = subprocess.run(
        ["gh", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if check and proc.returncode != 0:
        print(f"Error: gh {' '.join(args)}\n{proc.stderr}", file=sys.stderr)
        sys.exit(1)
    return proc.stdout.strip()


def read_local(path):
    """Read a local file; return empty string if missing."""
    try:
        return Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        print(f"  [skip] {path} not found", file=sys.stderr)
        return ""


def get_repo():
    """Resolve owner/repo from env or the git remote."""
    repo = os.environ.get("GITHUB_REPOSITORY")
    if repo:
        return repo
    return (
        gh("repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner", check=False)
        or None
    )


# --- GitHub data fetching ---------------------------------------------------


def get_pr_meta(pr_number, repo):
    return json.loads(
        gh(
            "pr",
            "view",
            str(pr_number),
            "--repo",
            repo,
            "--json",
            "title,body,headRefName,baseRefName,author,"
            "additions,deletions,changedFiles,files,commits,isDraft",
        )
    )


def get_pr_diff(pr_number, repo):
    """Fetch the unified diff, falling back to per-file patches if too large."""
    result = subprocess.run(
        ["gh", "pr", "diff", str(pr_number), "--repo", repo],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()

    if any(s in result.stderr for s in ("406", "too_large", "exceeded")):
        print("Diff too large -- falling back to per-file patches", file=sys.stderr)
        raw = gh(
            "api",
            f"repos/{repo}/pulls/{pr_number}/files",
            "--paginate",
            "-q",
            ".[].patch // empty",
            check=False,
        )
        if raw:
            return raw
    print(f"Error: gh pr diff {pr_number} --repo {repo}\n{result.stderr}", file=sys.stderr)
    sys.exit(1)


def get_file_content(repo, filepath, ref):
    """Get full file content. Try local first, then the GitHub contents API."""
    local = Path(filepath)
    if local.exists():
        try:
            return local.read_text(encoding="utf-8")
        except OSError:
            pass
    raw = gh(
        "api",
        f"repos/{repo}/contents/{filepath}",
        "-f",
        f"ref={ref}",
        "--jq",
        ".content",
        check=False,
    )
    if not raw:
        return None
    try:
        return base64.b64decode(raw).decode("utf-8")
    except (ValueError, UnicodeDecodeError):
        return None


def fetch_changed_file_contents(repo, changed_files, ref):
    """Fetch full content for every changed file in the PR."""
    contents = {}
    for fp in changed_files:
        content = get_file_content(repo, fp, ref)
        if content is not None:
            contents[fp] = content
    return contents


def next_review_version(pr_number, repo):
    """Return the next review version by counting prior successful reviews.

    Single-pass mode: we use the count only for the version label and marker,
    not to feed prior findings back into the model.
    """
    versions = []
    for endpoint in (
        f"repos/{repo}/pulls/{pr_number}/reviews",
        f"repos/{repo}/issues/{pr_number}/comments",
    ):
        raw = gh("api", endpoint, "--paginate", check=False)
        if not raw:
            continue
        try:
            for item in json.loads(raw):
                body = (item.get("body") or "").strip()
                m = MARKER_RE.search(body)
                if m and not _is_failed_review(body):
                    versions.append(int(m.group(1)))
        except json.JSONDecodeError:
            pass
    return (max(versions) + 1) if versions else 1


# --- Rules loading ----------------------------------------------------------


def load_rules_for_layer(layer):
    """Concatenate the rule/spec files a layer asks for."""
    parts = []
    for path in layer.get("rules", []):
        content = read_local(path)
        if content:
            parts.append(f"### {Path(path).name}\n{content}")
    return "\n\n---\n\n".join(parts)


# --- Prompt construction ----------------------------------------------------


def _file_list(meta):
    return "\n".join(
        f"- `{f['path']}` (+{f.get('additions', 0)} -{f.get('deletions', 0)})"
        for f in meta.get("files", [])
    )


def _truncate_diff(diff):
    if len(diff) > MAX_DIFF_CHARS:
        return diff[:MAX_DIFF_CHARS], "> **Note:** Diff truncated due to size.\n"
    return diff, ""


def _build_file_contents_block(file_contents):
    """Build a text block of full file contents, capped to a per-layer budget."""
    parts = []
    total = 0
    for fp, content in file_contents.items():
        remaining = MAX_FILE_CONTENT_PER_LAYER - total
        if remaining <= 0:
            parts.append(f"#### `{fp}`\n*(omitted, budget exhausted)*")
            continue
        if len(content) > remaining:
            parts.append(f"#### `{fp}` *(truncated)*\n```\n{content[:remaining]}\n```")
            total = MAX_FILE_CONTENT_PER_LAYER
        else:
            parts.append(f"#### `{fp}`\n```\n{content}\n```")
            total += len(content)
    return "\n\n".join(parts)


def build_layer_prompt(layer, meta, diff, file_contents, repo, pr_number):
    """Build the system + user prompt for a single review layer."""
    today = date.today().isoformat()
    rules_text = load_rules_for_layer(layer)

    system = (
        f"You are a specialist code reviewer for {repo}.\n"
        f"Your role: **Layer {layer['id']} -- {layer['name']}**.\n"
        f"Today's date is {today}.\n\n"
        f"FOCUS AREA:\n{layer['focus']}\n\n"
        "INSTRUCTIONS:\n"
        "- Review ONLY your focus area. Do NOT review other layers.\n"
        "- READ THE PR DESCRIPTION carefully; it explains the author's intent. A "
        "change that looks wrong in isolation may be correct for the feature.\n"
        "- CRITICAL SCOPE RULE: ONLY flag issues INTRODUCED or MODIFIED by this "
        "PR's diff. Read the diff line prefixes:\n"
        "  * '+' lines are NEW / CHANGED code -- IN SCOPE.\n"
        "  * '-' lines are REMOVED code; they no longer exist at HEAD. Never flag a "
        "defect in a '-' line. If you are quoting code with a '-' prefix, STOP -- "
        "that code is gone.\n"
        "  * unprefixed lines are unchanged context -- OUT OF SCOPE.\n"
        "  Do NOT flag pre-existing code that this PR did not touch.\n"
        "- The full file contents are CONTEXT ONLY (to trace imports, callers, data "
        "flow, and to confirm a symbol you cite actually exists at HEAD). They are "
        "NOT a source of new issues.\n"
        "- Before writing a finding, confirm the symbol appears in the current file "
        "contents. If you cannot find it, discard the finding.\n"
        "- Distinguish DESIGN DECISIONS from BUGS: if a change is intentional per the "
        "PR description, only flag a concrete defect in its implementation.\n"
        "- Severity levels: CRITICAL, HIGH, MEDIUM, LOW.\n"
        "- Quote EXACT lines from the diff. Never invent code.\n"
        "- Be CONCISE. Flag real bugs, not style/naming/architecture opinions. If in "
        "doubt, don't flag it.\n"
        f"- If you find NO issues, respond exactly: 'No issues found in Layer "
        f"{layer['id']}: {layer['name']}'\n\n"
        "OUTPUT FORMAT:\n"
        "A markdown list of issues, each with severity, file, and details. No "
        "preamble, no summary, no verdict. Example:\n"
        "### HIGH: Unvalidated request body -- `server/src/routes/games.ts`\n"
        "```ts\n// Current:\nconst { code } = req.body;\n"
        "// Should be: validate with a zod schema first\n```\n"
        "**Impact:** Untyped input reaches the service layer (violates CODE-2).\n"
    )

    diff_text, note = _truncate_diff(diff)
    files_block = _build_file_contents_block(file_contents)

    pr_body = (meta.get("body") or "").strip()
    pr_desc_block = f"### PR Description (author's intent)\n{pr_body[:3000]}\n\n" if pr_body else ""

    user = (
        f"## PR Context\n"
        f"- **PR:** #{pr_number}\n"
        f"- **Title:** {meta.get('title', '')}\n"
        f"- **Branch:** `{meta.get('headRefName', '')}` -> `{meta.get('baseRefName', '')}`\n"
        f"- **Files Changed:** {meta.get('changedFiles', 0)}\n\n"
        f"{pr_desc_block}"
        f"### Changed Files\n{_file_list(meta)}\n\n"
    )
    if rules_text:
        user += f"## Project Rules for This Layer\n{rules_text}\n\n"
    user += (
        f"## Full File Contents (current HEAD)\n{files_block}\n\n"
        f"## Diff\n{note}```diff\n{diff_text}\n```"
    )
    return system, user


def build_aggregator_prompt(layer_results, meta, repo, pr_number, version):
    """Build the prompt that merges the 8 layer results into one review."""
    today = date.today().isoformat()
    pr_body = (meta.get("body") or "").strip()

    system = (
        f"You are the lead reviewer for {repo}.\n"
        f"Today's date is {today}. The PR number is #{pr_number}. "
        f"This is review version **v{version}**.\n\n"
        "You received findings from 8 specialist layers that ran in parallel. "
        "Your job:\n"
        "1. MERGE all findings into one structured review.\n"
        "2. DEDUPLICATE: if multiple layers flagged the same issue, keep the most "
        "detailed one.\n"
        "3. VALIDATE: aggressively drop false positives -- invented code, changes the "
        "PR description explains as intentional, style/naming preferences, "
        "architecture suggestions, or missing tests for trivial utility code.\n"
        "4. SCOPE CHECK: drop findings about pre-existing code the diff did not touch.\n"
        "5. ASSIGN final severity: CRITICAL, HIGH, MEDIUM, LOW.\n"
        "6. DETERMINE the verdict using this matrix:\n"
        "   - Any CRITICAL -> REQUEST CHANGES\n"
        "   - 3+ HIGH -> REQUEST CHANGES\n"
        "   - 1-2 HIGH, no CRITICAL -> COMMENT\n"
        "   - Only MEDIUM/LOW -> APPROVE\n"
        "   - No issues -> APPROVE\n\n"
        "Be strict: a good review has 0-5 real findings, not 15-40. If you list more "
        "than 10, you are almost certainly including false positives -- re-filter.\n\n"
        "OUTPUT FORMAT (use exactly):\n"
        "```\n"
        "# PR Review: #<N> - <Title>\n\n"
        "## Summary\n"
        "- **Files Changed:** <count>\n"
        "- **Scope:** <backend | frontend | database | infra | tests | docs>\n"
        "- **Layers Executed:** 8 (parallel)\n"
        "- **Review Version:** v<N>\n\n"
        "## CRITICAL (<count>)\n"
        "### 1. <Title> -- `file/path`\n"
        "<description with code snippets>\n"
        "**Impact:** <why it matters>\n\n"
        "## HIGH (<count>)\n...\n"
        "## MEDIUM (<count>)\n...\n"
        "## LOW (<count>)\n...\n\n"
        "## Layer Summary\n"
        "| Layer | Status | Issues |\n"
        "|-------|--------|--------|\n"
        "| 1. Functional Correctness | Pass/Fail | <count> |\n"
        "| ... |\n\n"
        "## Verdict: APPROVE | REQUEST CHANGES | COMMENT\n"
        "```\n\n"
        "Do NOT use HTML <details> tags; show all content expanded.\n"
    )

    pr_desc_agg = f"\n## PR Description (author's stated intent)\n{pr_body[:3000]}\n" if pr_body else ""
    user_parts = [
        f"## PR: #{pr_number} -- {meta.get('title', '')}\n",
        pr_desc_agg,
        f"### Changed Files\n{_file_list(meta)}\n",
        "\n## Layer Findings\n",
    ]
    for layer_id, layer_name, result in layer_results:
        user_parts.append(f"---\n\n### Layer {layer_id}: {layer_name}\n\n{result}\n")
    return system, "\n".join(user_parts)


# --- LLM API ----------------------------------------------------------------


def _get_client():
    """Create an Anthropic client, validating the API key."""
    if anthropic is None:
        raise RuntimeError(
            "The anthropic package is required. Install: pip install 'anthropic>=0.40,<1.0'"
        )
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it as a repo secret "
            "(Settings > Secrets and variables > Actions)."
        )
    return anthropic.Anthropic(api_key=api_key)


def call_claude(client, system, user, max_tokens):
    resp = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return resp.content[0].text


def run_layer(client, layer, meta, diff, file_contents, repo, pr_number):
    """Run a single review layer (called from the thread pool)."""
    layer_id, layer_name = layer["id"], layer["name"]
    print(f"  [Layer {layer_id}] Starting: {layer_name}...")
    system, user = build_layer_prompt(layer, meta, diff, file_contents, repo, pr_number)
    try:
        result = call_claude(client, system, user, LAYER_MAX_TOKENS)
        print(f"  [Layer {layer_id}] Done: {layer_name}")
        return layer_id, layer_name, result
    except Exception as e:  # noqa: BLE001 -- one layer failing must not abort the rest
        print(f"  [Layer {layer_id}] ERROR: {e}", file=sys.stderr)
        return layer_id, layer_name, f"*Layer failed: {e}*"


# --- Post review ------------------------------------------------------------

_SAFE_LOGIN_RE = re.compile(r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,38})?$")
_VERDICT_HEADING_RE = re.compile(
    r"^\s*(?:#{1,6}\s+|\*\*\s*)?verdict\s*[:*]+\s*(.+?)\s*\*{0,2}\s*$",
    re.IGNORECASE,
)


def _detect_verdict(review_body):
    """Parse the verdict from heading-style lines; default COMMENT.

    Uses the LAST matching line so a template echo earlier in the body doesn't
    override the real verdict at the bottom.
    """
    result = "COMMENT"
    for line in review_body.splitlines():
        m = _VERDICT_HEADING_RE.match(line)
        if not m:
            continue
        text = m.group(1).lower()
        if "request changes" in text or "request_changes" in text:
            result = "REQUEST_CHANGES"
        elif "approve" in text:
            result = "APPROVE"
        else:
            result = "COMMENT"
    return result


def post_review(pr_number, repo, body, version, sha, author=None, dry_run=False):
    """Post the review as a GitHub PR review, tagging the author."""
    marker = f"<!-- trivyy-pr-review:v{version}:{sha} -->"
    author_tag = f"cc @{author}\n\n" if author else ""
    full = f"{marker}\n{author_tag}{body}"
    verdict = _detect_verdict(body)

    if dry_run:
        print(f"\n{'=' * 60}\nDRY RUN -- would post v{version} ({sha[:8]}), verdict {verdict}")
        print(f"{'=' * 60}\n{full[:3000]}")
        if len(full) > 3000:
            print(f"\n... ({len(full) - 3000} more chars)")
        return

    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False, encoding="utf-8") as f:
        f.write(full)
        tmp = f.name
    flag = {
        "REQUEST_CHANGES": "--request-changes",
        "APPROVE": "--approve",
    }.get(verdict, "--comment")
    try:
        gh("pr", "review", str(pr_number), "--repo", repo, flag, "--body-file", tmp)
        print(f"Review v{version} posted ({verdict}).")
    except SystemExit:
        # gh() exits on failure (e.g. a bot cannot approve its own PR). Fall
        # back to a plain comment so the review is never lost.
        print("  [warn] gh pr review failed; falling back to comment", file=sys.stderr)
        gh("pr", "comment", str(pr_number), "--repo", repo, "--body-file", tmp)
        print(f"Review v{version} posted as comment (fallback).")
    finally:
        os.unlink(tmp)


# --- Main -------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Trivyy 8-Layer Parallel PR Review")
    parser.add_argument("--pr", type=int, help="PR number (default: PR_NUMBER env)")
    parser.add_argument("--repo", help="owner/repo (default: GITHUB_REPOSITORY env)")
    parser.add_argument("--dry-run", action="store_true", help="Skip API calls + posting")
    args = parser.parse_args()

    pr_number = args.pr or int(os.environ.get("PR_NUMBER", 0))
    repo = args.repo or get_repo()
    if not pr_number or not repo:
        print("Error: --pr and --repo (or env vars) required.", file=sys.stderr)
        sys.exit(1)

    print(f"Reviewing PR #{pr_number} on {repo} (8-layer parallel)...")

    meta = get_pr_meta(pr_number, repo)
    if meta.get("isDraft"):
        print("PR is a draft -- skipping.")
        return

    commits = meta.get("commits", [])
    current_sha = commits[-1]["oid"] if commits else "unknown"
    changed_files = [f["path"] for f in meta.get("files", [])]
    head_ref = meta.get("headRefName", "")
    raw_login = (meta.get("author") or {}).get("login", "")
    author = raw_login if raw_login and _SAFE_LOGIN_RE.match(raw_login) else ""

    diff = get_pr_diff(pr_number, repo)
    print(f"  Diff: {len(diff):,} chars, {len(changed_files)} files")

    print("  Fetching full file contents...")
    file_contents = fetch_changed_file_contents(repo, changed_files, head_ref)
    total = sum(len(v) for v in file_contents.values())
    print(f"  Loaded {len(file_contents)} files ({total:,} chars)")

    version = next_review_version(pr_number, repo)
    print(f"  Review version: v{version}")

    if args.dry_run:
        print(f"\n{'=' * 60}\nDRY RUN -- would run 8 layers + 1 aggregator (model: {MODEL})")
        for layer in LAYERS:
            system, user = build_layer_prompt(layer, meta, diff, file_contents, repo, pr_number)
            print(f"  Layer {layer['id']}: {len(system) + len(user):,} prompt chars")
        print(f"{'=' * 60}")
        return

    print(f"\nRunning 8 review layers in parallel (model: {MODEL})...")
    client = _get_client()
    layer_results = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {
            pool.submit(run_layer, client, layer, meta, diff, file_contents, repo, pr_number): layer
            for layer in LAYERS
        }
        for future in as_completed(futures):
            layer_results.append(future.result())
    layer_results.sort(key=lambda r: r[0])

    print("\nAggregating findings...")
    agg_system, agg_user = build_aggregator_prompt(layer_results, meta, repo, pr_number, version)
    try:
        review = call_claude(client, agg_system, agg_user, AGGREGATOR_MAX_TOKENS)
    except Exception as e:  # noqa: BLE001
        print(f"Aggregator error: {e}", file=sys.stderr)
        review = f"# PR Review: #{pr_number} (Aggregation Failed)\n\n"
        review += "*Aggregation hit an internal error. Raw layer results below.*\n\n"
        for layer_id, layer_name, result in layer_results:
            review += f"## Layer {layer_id}: {layer_name}\n\n{result}\n\n---\n\n"

    print(f"\nPosting v{version} review...")
    try:
        post_review(pr_number, repo, review, version, current_sha, author=author)
    except Exception as e:  # noqa: BLE001
        print(f"Failed to post review: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
