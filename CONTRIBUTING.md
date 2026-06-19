# Contributing to Trivyy

The rules in [`rules.md`](./rules.md) are binding. This guide summarizes the
workflow; the rule IDs in parentheses are the source of truth.

## Workflow

1. **Trace to an issue.** Every change maps to a GitHub issue or Jira key (SDD-1).
   No code for a feature until its spec is approved (SDD-2).
2. **Branch.** Use a prefix: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`,
   `test/` — lowercase with hyphens (GIT-1). Branches live three days max (GIT-2).
3. **Test-drive.** Write tests before or with the code (TEST-1). Keep total
   coverage at or above 80 percent (TEST-2, DOD-1).
4. **Commit.** Conventional Commits, e.g. `feat(game): add duel join flow` (GIT-3).
5. **Open a PR** against `main`, fill in the template, attach evidence
   (command output or a Playwright screenshot — DOD-2, DOD-3).
6. **Pass the gates.** CI (lint, format, typecheck, tests + coverage, secret
   scan) and the AI PR review must be green (CI-1..6).
7. **Merge** by squash only, after one approval and all conversations resolved
   (GIT-5, GIT-6). No direct pushes to `main` (GIT-7).

## Local checks before pushing

```bash
npm run lint && npm run format:check && npm run typecheck && npm test
```

Pre-commit hooks (husky + lint-staged + gitleaks) run format, lint, and a secret
scan automatically (GIT-8).

## Code style

- TypeScript everywhere; explicit types on public functions (CODE-1).
- Validate all input with zod; never pass untyped request bodies (CODE-2).
- Config from environment variables only (CODE-3).
- Functions under 50 lines, files under 800, nesting <= 4 (CODE-4, CODE-5).
- Handle every I/O error; never leak internals in messages (CODE-6).
- No `console.log` in committed backend code — use the JSON logger (OBS-1).
