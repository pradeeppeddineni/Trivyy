# Build It With Claude: End-to-End Engineering Lifecycle Workshop

A 7.5-hour course that takes college students from a blank page to a deployed, governed, production-shaped web application, built entirely with the Claude toolchain and governed by a scaled-down version of the Amida Engineering Playbook and the Data Prism Constitution.

**The project:** a live multiplayer trivia game (host screen plus phone players), self-hosted on a Raspberry Pi backend and published at a real domain.

**The thesis:** the speed of the agent is not the lesson. The lesson is the discipline that surrounds the agent, the spec, the gates, the tests, the review, and the deploy. Students leave knowing how professionals actually ship, not just how to prompt.

---

## Who this is for and what they need

- **Audience:** college students who can read code but have not shipped a governed application.
- **Accounts:** a Claude subscription (Pro or higher, for Claude Code), a GitHub account in a shared org, and an Atlassian (Jira) account.
- **Hardware:** the instructor's Raspberry Pi as the shared deploy target; students build locally.
- **Pre-reads:** the scaled "Trivia Playbook" and "Trivia Constitution" handed out before class.

---

## The Claude toolchain, and where each tool earns its place

| Tool                                | Used for                                                               | Lifecycle stage        |
| ----------------------------------- | ---------------------------------------------------------------------- | ---------------------- |
| Claude.ai (chat)                    | Research, ideation, drafting the spec, constitution, and decisions log | Research and Plan      |
| Claude Design                       | The design system, tokens, components, and screen mockups              | Design                 |
| Claude Code (CLI)                   | The build, with CLAUDE.md, plan mode, and skills                       | Build, test, debug     |
| Claude Code subagents / agent teams | Parallel work on schema, API, frontend, and tests                      | Build                  |
| MCP: GitHub                         | Branches, PRs, and the review loop                                     | Governance and PR flow |
| MCP: Atlassian (Jira)               | Specs as the system of record, branch-from-issue                       | Plan and traceability  |
| MCP: Playwright                     | E2E tests and agent self-verification with screenshots                 | Test and verify        |
| Anthropic API                       | Building the 8-layer PR review agent                                   | Quality gate           |
| Claude Cowork (optional)            | Orchestrating the non-code artifacts (docs, runbooks)                  | Throughout             |

---

## The day at a glance

| Block | Time         | Stage                       | Primary tools                     |
| ----- | ------------ | --------------------------- | --------------------------------- |
| 0     | 0:00 to 0:30 | Kickoff and research        | Claude.ai                         |
| 1     | 0:30 to 1:15 | Spec-driven foundation      | Claude.ai, Claude Code            |
| 2     | 1:15 to 1:45 | Design system               | Claude Design                     |
| 3     | 1:45 to 2:30 | Repo, governance, and gates | Claude Code, GitHub MCP           |
| 4     | 2:30 to 3:00 | Tests-first harness         | Claude Code, Playwright MCP       |
| ---   | 3:00 to 3:30 | Break                       | ---                               |
| 5     | 3:30 to 4:15 | Walking skeleton            | Claude Code subagents             |
| 6     | 4:15 to 5:45 | Feature build               | Agent team, plan mode, Playwright |
| 7     | 5:45 to 6:30 | Build the PR review agent   | Anthropic API, GitHub Actions     |
| 8     | 6:30 to 7:00 | PR workflow and gates live  | GitHub MCP                        |
| 9     | 7:00 to 7:30 | Hosting and deploy          | Pi, Cloudflare Tunnel, domain     |
| 10    | 7:30 to 7:45 | Wrap and industry bridge    | Claude.ai                         |

Security hardening and observability are woven through blocks 5 through 8 rather than bolted on at the end, the same way the Playbook intends.

---

## Block 0: Kickoff and research (0:00 to 0:30)

- **Stage:** research and ideation.
- **Tool:** Claude.ai chat.
- **What happens:** the class uses Claude to pressure-test the idea, not just accept it. Scope the trivia game, list the user types (host, player), sketch the core journey, and name the riskiest assumption. Students learn to treat the model as a thinking partner, not a code vending machine.
- **Rules taught:** product principles, the core journey completable without documentation (Constitution UX-1, UX-3).
- **Artifact:** a one-page problem statement and a scope boundary (in and out of scope).
- **Checkpoint:** every student can state the app in one sentence and name what it will not do.

## Block 1: Spec-driven foundation (0:30 to 1:15)

- **Stage:** plan, the heart of the method.
- **Tools:** Claude.ai to draft, Claude Code to commit into the repo, Jira via MCP as the system of record.
- **What happens:** write the scaled **Trivia Constitution** (a handful of SHALL rules with IDs), the **feature spec** for the game loop, and the **CLAUDE.md** and **AGENTS.md** memory files. Create the first Jira issue and learn the rule: no code until a human approves the spec.
- **Rules taught:** spec-driven workflow, the spec is the contract, work traces to a Jira key, constitution amendments need a PR and an approval (Constitution SDD-1 through SDD-5, GOV-1 through GOV-4; Playbook OP-002).
- **Artifact:** `.specify/` directory with the constitution, the spec, and CLAUDE.md, plus a Jira epic.
- **Checkpoint:** the spec is reviewed out loud and approved before anyone writes a line of code.

## Block 2: Design system with Claude Design (1:15 to 1:45)

- **Stage:** design, before any frontend code.
- **Tool:** Claude Design.
- **What happens:** generate the trivia game's identity, design tokens (color, type, spacing), and the core components (buttons, the question card, the answer pills, the leaderboard row, the timer), plus the four required screen states. This mirrors the house style guides and teaches tokens as the single styling source.
- **Rules taught:** an approved UI spec and tokens before frontend work, one component library, explicit loading, empty, error, and success states, no hard-coded style values (Constitution UI-1 through UI-4, UX-3).
- **Artifact:** a style guide document and a token set the build will consume.
- **Checkpoint:** the design is approved and the tokens are named, so no raw hex values appear later.

## Block 3: Repo, governance, and gates (1:45 to 2:30)

- **Stage:** governance, set up clean from commit zero.
- **Tools:** Claude Code to generate the files, GitHub via MCP to create the repo and apply protection.
- **What happens:** create the private repo and scaffold everything the Playbook requires before features exist: LICENSE, CONTRIBUTING, CODEOWNERS, the PR template, a correct `.gitignore`, `.env.example`, pre-commit hooks, Dependabot, and branch protection on `main`. Set the branch-naming and conventional-commit rules.
- **Rules taught:** private repos, branch protection, CODEOWNERS, PR template, pre-commit hooks, squash-merge only, no direct pushes to main, branch naming, Conventional Commits (Playbook RG-001 through RG-012, GIT-001 through GIT-010; Constitution REPO-1 through REPO-4).
- **Artifact:** a governed empty repo that already blocks bad commits.
- **Checkpoint:** a student tries to push to `main` and watches it get rejected. The gate is real.

## Block 4: Tests-first harness (2:30 to 3:00)

- **Stage:** test, built before the feature, exactly as requested.
- **Tools:** Claude Code, Playwright via MCP.
- **What happens:** stand up the pytest structure, the coverage gate at 80 percent with no override, and the Playwright E2E skeleton with a first failing test for "a player can join a game." Students see red before they see green, and learn that the harness comes first.
- **Rules taught:** test-driven development, at least 80 percent coverage with no override, unit tests for logic, integration tests for endpoints, Playwright for critical flows (Playbook TS-001 through TS-006; Constitution TEST-1 through TEST-3, DOD-1).
- **Artifact:** a running (failing) test suite and the CI test job.
- **Checkpoint:** the first E2E test fails for the right reason, and the class reads the failure together.

### Break (3:00 to 3:30)

## Block 5: The walking skeleton (3:30 to 4:15)

- **Stage:** build the thinnest end-to-end slice.
- **Tools:** Claude Code with subagents, the GitHub MCP for the first real PR.
- **What happens:** build a single slice that runs end to end: a host versus player role check, one question served and answered, structured logging, and the events table. No game polish yet. Every gate must be green on this first PR.
- **Rules taught:** walking-skeleton-first, structured JSON logging instead of `print`, an immutable audit trail, RBAC enforced at the API layer (Constitution walking-skeleton note, OBS-1; Playbook CQ-009, SEC-002, SEC-006).
- **Artifact:** the first merged PR, fully gated.
- **Checkpoint:** the CI run is green for the right reasons, and the events table shows the first logged rows.

## Block 6: Feature build with an agent team (4:15 to 5:45)

- **Stage:** build the real product.
- **Tools:** Claude Code agent team (parallel subagents), plan mode, Playwright self-verify, Claude Design tokens.
- **What happens:** this is the longest block and the showcase. Run plan mode first and review the plan as a class. Then let subagents work in parallel on the WebSocket game loop, the scoring service, and the host and player screens. The agent self-verifies the UI through Playwright with screenshots and does not declare work done without visual evidence.
- **Rules taught:** plan, implement, verify, tests before or with code, self-verify UI with evidence not assertions, functions under 50 lines, files under 800, no deep nesting, immutable patterns, real error handling (Constitution AGENT-1 through AGENT-3, DOD-2, DOD-3; Playbook CQ-012 through CQ-015, CQ-014).
- **Artifact:** a playable game on localhost, covered by tests and screenshots.
- **Checkpoint:** the class plays a round from two phones, then opens the Playwright evidence.

## Block 7: Build the 8-layer PR review agent (5:45 to 6:30)

- **Stage:** quality gate, built by the students, the most on-theme block.
- **Tools:** the Anthropic API, GitHub Actions.
- **What happens:** students build the AI PR reviewer that reads a diff and reviews it across the eight layers (functional correctness, security, backend standards, frontend standards, test quality, database standards, API contract, and domain checks), then posts comments on the PR. They wire it as `pr-review.yml` triggered on every pull request. The students build with Claude and let Claude review the work.
- **Rules taught:** the 8-layer review, a PR review agent on every repo, the API key from a secret never code, least-privilege workflow permissions (Playbook GIT-007, CI-005, CI-008, SEC-009).
- **Artifact:** a working `pr-review.yml` and the review script.
- **Checkpoint:** open a deliberately flawed PR and watch the agent catch it.

## Block 8: The PR workflow and gates, live (6:30 to 7:00)

- **Stage:** the governed merge loop in motion.
- **Tools:** GitHub via MCP, Jira via MCP.
- **What happens:** run a full real cycle: branch from the Jira issue with the correct name, make a change, write a conventional commit, open a PR with the template filled in, let CI and the review agent run, resolve the comments, get one human approval, and squash-merge. Then plant and hunt a bug from the logs to teach systematic debugging.
- **Rules taught:** branch from Jira, conventional commits, PR template with evidence, one human approval, resolve all conversations, squash-merge, respond to review comments (Playbook GIT-003 through GIT-008, RG-005, RG-007; Constitution AGENT-4, AGENT-5, DOD-5).
- **Artifact:** a clean, gated merge and a closed bug with a regression test.
- **Checkpoint:** the merged history shows one tidy squash commit per PR.

## Block 9: Hosting and deploy (7:00 to 7:30)

- **Stage:** ship it, on hardware the students can see.
- **Tools:** the Raspberry Pi, Cloudflare Tunnel, a custom domain, Claude Code for the deploy scripts.
- **What happens:** deploy the backend to the Pi as a systemd service or Docker container so it survives reboots, publish it through a Cloudflare Tunnel at a real domain (mirroring a personal-website setup), and confirm dev and prod parity. Write the incident runbook.
- **Rules taught:** local run via docker-compose, onboarding under thirty minutes, canary or blue-green parity, an incident-response runbook, no public exposure of data stores (Playbook OP-009, OP-010; Constitution REPO-6, REPO-7; security subset).
- **Artifact:** the live game at a public URL, served from the Pi.
- **Checkpoint:** students open the domain on cellular, off the room WiFi, and play.

## Block 10: Wrap and the industry bridge (7:30 to 7:45)

- **Stage:** close the lifecycle and connect to the real world.
- **Tool:** Claude.ai.
- **What happens:** confirm the docs, the README, the `.env.example`, and one ADR are in place. Walk the scaled checklist they just satisfied, then name what this becomes at enterprise scale: NIST 800-53, Entra and MSAL, managed identities, PHI redaction, and the honest reality that most real repos are not yet compliant.
- **Rules taught:** documentation in the README, ADRs, environment variable documentation, the definition of done (Playbook OP-001 through OP-003; Constitution DOD-1 through DOD-7).
- **Artifact:** a finished, documented, deployed, governed application.
- **Checkpoint:** every student can name the full lifecycle from memory and point to where each Claude tool fit.

---

## Appendix A: The scaled "Every Repo Must Have" checklist

The students should be able to tick all of these by the end, the same list as the Playbook, scaled to one repo:

- A constitution and a spec under `.specify/`
- CLAUDE.md and AGENTS.md
- LICENSE, CONTRIBUTING, CODEOWNERS, and a PR template
- A pre-commit config and a blocking `ci.yml`
- A `pr-review.yml` 8-layer agent
- `.env.example` and a correct `.gitignore`
- Branch protection on `main`
- At least 80 percent test coverage and a Playwright E2E suite
- A README, one ADR, and an incident runbook
- A live deploy on the Pi at a public domain

## Appendix B: Tool-to-stage cheat sheet

- **Think and plan:** Claude.ai.
- **Design:** Claude Design.
- **Build, test, debug:** Claude Code plus subagents.
- **Connect to GitHub, Jira, and the browser:** MCP.
- **Verify the UI:** Playwright.
- **Gate quality:** the Anthropic API review agent.
- **Ship:** the Pi plus a Cloudflare Tunnel and a domain.

## Appendix C: Notes for the instructor

- Decide demo mode versus workshop mode per block. Blocks 0 through 4 work well as guided demos; blocks 5 through 9 work well as student-driven work with the checkpoints as timers.
- Pre-build a clean reference repo so any block can be reset if a group falls behind.
- The two heaviest blocks are 6 (feature build) and 7 (the review agent). Protect their time.
- This outline draws on the Amida Engineering Playbook and the Data Prism Constitution, Engineering Conventions, and Reference Engineering Practices pages. The remaining Data Prism pages (Overview, Architecture, API Guide, Observability, UI Spec, and the Open Decisions Log) can deepen blocks 1, 2, and 5 if you want more source detail.
