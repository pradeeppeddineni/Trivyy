# Evidence

Durable, in-repo verification evidence (DOD-2, DOD-3).

## Playwright E2E

- The **`E2E (Playwright)`** CI job (`.github/workflows/ci.yml`) runs the suite on
  every PR and push, then uploads the full Playwright report (with per-run
  screenshots + traces) as the **`playwright-report`** artifact, downloadable from
  the PR's **Checks** tab.
- `phase0-gallery.png` — full-page Playwright screenshot of the Phase 0
  design-system gallery, kept here as a durable visual reference of the component
  library (matches the Claude Design prototype's look).

Each E2E run also attaches a fresh full-page screenshot inside the Playwright HTML
report (the `gallery` attachment in `e2e/tests/gallery.spec.ts`). Pixel-level
visual-regression gating (committed `toHaveScreenshot` goldens) turns on once
fonts are self-hosted for deterministic cross-environment rendering.
